/**
 * @file This service is responsible for generating structured report data.
 * It acts as an orchestrator, pulling data from various stores and using
 * logic services to assemble final, presentation-ready report objects.
 */

import { usePersonnelStore } from "../stores/personnelStore";
import { useSyllabiStore } from "../stores/syllabiStore";
import {
  getPrioritizedRequirements,
  getPrioritizedUpgraders,
} from "./trainingLogicService";
import {
  type IndividualReport,
  type TrackReport,
  type LLMAnonymizedMultiPositionMonthlyReport,
  type LLMAnonymizedPositionLevelReportData,
  type LLMAnonymizedUpgraderReportData,
  type MonthlyReportData,
  type MonthlyTrackSummary,
} from "../types/reportTypes";
import { loggingService } from "../utils/loggingService";
import { ReadinessStatus, Upgrader } from "@/types/personnelTypes";
import { anonymizeData } from "@/utils/anonymizer";
import { addDays } from "date-fns";
import { getTodayUtc } from "@/utils/dateUtils";
import { RequirementType, Syllabus } from "@/types/syllabiTypes";
const SVC_MODULE = "[ReportGenerator]";

/**
 * Helper function to resolve the correct syllabus for an upgrader.
 * It checks for a level-specific syllabus first, then falls back to the default.
 */
function resolveActiveSyllabus(upgrader: Upgrader): Syllabus | undefined {
  const syllabiStore = useSyllabiStore();
  const defaultYear = upgrader.assignedSyllabusYear;
  let activeYear = defaultYear;

  if (upgrader.levelSyllabusYears && upgrader.derivedPqsWorkingLevel) {
    const baseLevel =
      Math.floor(parseInt(upgrader.derivedPqsWorkingLevel) / 100) * 100;
    if (upgrader.levelSyllabusYears[baseLevel]) {
      activeYear = upgrader.levelSyllabusYears[baseLevel];
      loggingService.logInfo(
        `[ReportGenerator] Using level-specific syllabus ${activeYear} for ${upgrader.displayName}`
      );
    }
  }

  return syllabiStore.findSyllabus(upgrader.assignedPosition, activeYear);
}

/**
 * Generates a detailed report for a single upgrader.
 * @param upgraderId The ID of the upgrader to generate the report for.
 * @returns An `IndividualReport` object, or null if the upgrader or their syllabus can't be found.
 */
export function generateIndividualReport(
  upgraderId: string
): IndividualReport | null {
  loggingService.logInfo(
    `${SVC_MODULE} Generating individual report for ID: ${upgraderId}`
  );

  const personnelStore = usePersonnelStore();
  const upgrader = personnelStore.getPersonnelById(upgraderId);

  if (!upgrader) {
    loggingService.logError(
      `${SVC_MODULE} Could not find upgrader with ID: ${upgraderId}`
    );
    return null;
  }

  // Use the new helper to get the correct syllabus for this specific upgrader
  const syllabus = resolveActiveSyllabus(upgrader);

  if (!syllabus) {
    loggingService.logError(
      `${SVC_MODULE} Could not find syllabus for upgrader: ${upgrader.displayName}`
    );
    return null;
  }

  const priorityTasks = getPrioritizedRequirements(upgrader, syllabus);

  const report: IndividualReport = {
    upgrader: upgrader,
    summary: {
      readinessAgainstDeadline:
        upgrader.readinessAgainstDeadline || ReadinessStatus.Unknown,
      pacingAgainstDeadlineDays: upgrader.pacingAgainstDeadlineDays || 0,
      projectedCompletionDate:
        upgrader.projectedTotalCompletionDate || undefined,
    },
    priorityTasks: priorityTasks,
  };

  loggingService.logInfo(
    `${SVC_MODULE} Successfully generated individual report for ${upgrader.displayName}.`
  );
  return report;
}

/**
 * Generates a report for an entire track (position/year).
 */
export function generateTrackReport(
  position: string,
  year: string
): TrackReport | null {
  loggingService.logInfo(
    `${SVC_MODULE} Generating track report for ${position} ${year}`
  );
  const personnelStore = usePersonnelStore();
  const syllabiStore = useSyllabiStore();

  // For track-level reports, we use the specified year to get the base syllabus.
  // Individual variations are handled in their own reports.
  const syllabus = syllabiStore.findSyllabus(position, year);
  if (!syllabus) {
    loggingService.logError(
      `${SVC_MODULE} No syllabus found for ${position} ${year}`
    );
    return null;
  }

  const personnelForTrack = personnelStore.allPersonnel.filter(
    (p) => p.assignedPosition === position && p.assignedSyllabusYear === year
  );

  // The prioritized list for the whole track is based on the main track syllabus
  const prioritized = getPrioritizedUpgraders(personnelForTrack, syllabus);

  const summaryStats = {
    totalPersonnel: prioritized.length,
    numberOnTrack: prioritized.filter(
      (p) => p.readinessAgainstDeadline === ReadinessStatus.OnTrack
    ).length,
    numberAtRisk: prioritized.filter(
      (p) => p.readinessAgainstDeadline === ReadinessStatus.AtRisk
    ).length,
    numberBehind: prioritized.filter(
      (p) => p.readinessAgainstDeadline === ReadinessStatus.BehindSchedule
    ).length,
    numberBlocked: prioritized.filter(
      (p) => p.readinessAgainstDeadline === ReadinessStatus.Blocked
    ).length,
  };

  return {
    position,
    year,
    prioritizedUpgraders: prioritized,
    summaryStats,
  };
}

/**
 * Generates the anonymized report data structured for an LLM.
 * This has been enhanced to filter out irrelevant personnel and provide clearer data points.
 * @returns An object containing the structured report data and the keyMap for de-anonymization.
 */
export async function generateLLMReportData(): Promise<{
  reportData: LLMAnonymizedMultiPositionMonthlyReport;
  keyMap: Map<string, string>;
}> {
  const personnelStore = usePersonnelStore();

  // 1. Filter personnel to include only those with valid data and status
  const relevantPersonnel = personnelStore.allPersonnel.filter((p) => {
    const hasData = p.rawCompletions && p.rawCompletions.length > 0;
    const hasStatus =
      p.readinessAgainstDeadline &&
      p.readinessAgainstDeadline !== ReadinessStatus.Unknown;
    return hasData && hasStatus;
  });

  // 2. Anonymize the relevant data
  const { anonymizedPersonnel, keyMap } = anonymizeData(relevantPersonnel);

  const positionGroups = anonymizedPersonnel.reduce((acc, p) => {
    const key = p.assignedPosition;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, Upgrader[]>);

  const positionReports: LLMAnonymizedPositionLevelReportData[] = [];
  const today = getTodayUtc();
  const thirtyDaysAgo = addDays(today, -30);

  for (const [positionName, members] of Object.entries(positionGroups)) {
    const sortedMembers = members.sort((a, b) => {
      const levelA = parseInt(a.derivedPqsWorkingLevel || "0");
      const levelB = parseInt(b.derivedPqsWorkingLevel || "0");
      if (levelA !== levelB) return levelB - levelA;
      return a.displayName.localeCompare(b.displayName);
    });

    const upgraderReports: LLMAnonymizedUpgraderReportData[] = [];
    for (const upgrader of sortedMembers) {
      let status: LLMAnonymizedUpgraderReportData["overallStatus"] =
        "data_pending";
      const summaryPoints: string[] = [];
      let reportedLevel = upgrader.derivedPqsWorkingLevel;

      // 3. Provide clearer, more contextual data points to the AI
      if (
        upgrader.readinessAgainstDeadline === ReadinessStatus.ReadyForNextLevel
      ) {
        status = "complete"; // Simplified status for clarity
        const completedLevel =
          parseInt(upgrader.derivedPqsWorkingLevel || "0") - 100;
        reportedLevel = String(
          completedLevel > 0 ? completedLevel : upgrader.derivedPqsWorkingLevel
        );

        summaryPoints.push(
          `Status Note: Completed Level ${reportedLevel}. Now working on Level ${upgrader.derivedPqsWorkingLevel}.`
        );
        summaryPoints.push("Pacing: N/A (Level Complete)");
      } else {
        // Use the switch for all other "in-progress" statuses
        switch (upgrader.readinessAgainstDeadline) {
          case ReadinessStatus.OnTrack:
            status = "on_track";
            break;
          case ReadinessStatus.AtRisk:
            status = "at_risk";
            break;
          case ReadinessStatus.BehindSchedule:
            status = "behind";
            break;
          case ReadinessStatus.Blocked:
            status = "blocked";
            break;
        }
        summaryPoints.push(
          `Pacing: ${upgrader.pacingAgainstDeadlineDays ?? "N/A"} days`
        );
      }

      summaryPoints.push(
        `PQS Progress (current level): ${
          upgrader.pqsProgressPercentage?.toFixed(0) ?? "N/A"
        }%`
      );
      summaryPoints.push(
        `Event Progress (current level): ${
          upgrader.eventsProgressPercentage?.toFixed(0) ?? "N/A"
        }%`
      );

      const completedLastMonthCount = upgrader.rawCompletions.filter(
        (c) => new Date(c.date) >= thirtyDaysAgo
      ).length;

      const reportData: LLMAnonymizedUpgraderReportData = {
        anonymizedUpgraderId: upgrader.displayName,
        assignedPosition: upgrader.assignedPosition,
        currentPqsWorkingLevel: reportedLevel, // Report the correct level
        currentEventsWorkingLevel: upgrader.derivedEventsWorkingLevel,
        overallStatus: status,
        completedLastMonthCount: completedLastMonthCount,
        summaryPoints: summaryPoints,
      };
      upgraderReports.push(reportData);
    }

    const reportsByLevel = upgraderReports.reduce((acc, report) => {
      const level = parseInt(report.currentPqsWorkingLevel || "0");
      if (!acc[level]) acc[level] = [];
      acc[level].push(report);
      return acc;
    }, {} as Record<number, LLMAnonymizedUpgraderReportData[]>);

    for (const [level, reports] of Object.entries(reportsByLevel)) {
      positionReports.push({
        positionName: positionName,
        level: parseInt(level),
        upgraderReports: reports,
      });
    }
  }

  const reportData: LLMAnonymizedMultiPositionMonthlyReport = {
    reportGeneratedDate: today.toISOString().split("T")[0],
    positions: positionReports.sort((a, b) => b.level - a.level),
  };

  return { reportData, keyMap };
}

/**
 * Takes structured LLM report data and formats it into final prompt strings for the AI.
 *
 * @param reportData - The structured data object from generateLLMReportData.
 * @returns An object where keys are track names and values are the complete prompt strings.
 */
export function generateLlmPromptsFromData(
  reportData: LLMAnonymizedMultiPositionMonthlyReport
): { [trackName: string]: string } {
  const allPrompts: { [trackName: string]: string } = {};

  // Group reports by position name, as one position might have multiple levels
  const reportsByPosition = reportData.positions.reduce(
    (acc, positionReport) => {
      if (!acc[positionReport.positionName]) {
        acc[positionReport.positionName] = [];
      }
      acc[positionReport.positionName].push(positionReport);
      return acc;
    },
    {} as Record<string, LLMAnonymizedPositionLevelReportData[]>
  );

  for (const [positionName, reports] of Object.entries(reportsByPosition)) {
    const studentSummaries = reports
      .map((r) => r.upgraderReports)
      .flat()
      .map(
        (p) =>
          `- Student: ${p.anonymizedUpgraderId} (Level ${p.currentPqsWorkingLevel})\n` +
          `  - Status: ${p.overallStatus}\n` +
          `  - Pacing: ${
            p.summaryPoints?.[0]?.replace("Pacing: ", "") ?? "N/A"
          }\n` +
          `  - Last 30 Days: ${p.completedLastMonthCount} item(s) completed.`
      )
      .join("\n");

    const trackSummary = `
- Track: ${positionName}
- Total Students: ${reports
      .map((r) => r.upgraderReports.length)
      .reduce((a, b) => a + b, 0)}
    `.trim();

    const prompt = `
You are an expert training analyst for a military aviation unit. Your task is to provide a concise, insightful monthly training summary for a specific track.

Analyze the raw data provided below. The data is already sorted by ACTC level (descending) and then by student name (alphabetical). **Your report must follow this exact order.**

**OUTPUT FORMAT:**

1.  **Student Progress (Last 30 Days):**
    * Following the provided order, write 1-2 sentences for each student summarizing their progress and status.

2.  **Overall Track Health for '${positionName}':**
    * Write a 3-4 sentence summary of this track's overall performance, noting any trends or widespread issues.

3.  **Strategic Recommendations for '${positionName}':**
    * Write 2-4 sentences outlining the most effective path forward for this specific track. Identify top priorities and suggest concrete actions.

---
**RAW DATA FOR ANALYSIS (DO NOT REPEAT THIS SECTION IN YOUR OUTPUT):**

**Track Health Summary:**
${trackSummary}

**Sorted Student Data:**
${studentSummaries}
---

Now, please generate the complete narrative report for the '${positionName}' track based on the data and instructions provided.
    `;
    allPrompts[positionName] = prompt.trim();
  }

  return allPrompts;
}

/**
 * Generates a summary report of all training activity over the last 30 days.
 * @returns A MonthlyReportData object containing aggregated stats for each track.
 */
export function generateMonthlyReport(): MonthlyReportData {
  loggingService.logInfo(`${SVC_MODULE} Generating Monthly Report.`);

  const personnelStore = usePersonnelStore();
  const syllabiStore = useSyllabiStore();
  const today = getTodayUtc();
  const thirtyDaysAgo = addDays(today, -30);

  // Filter for personnel who have assigned tracks and completion data
  const relevantPersonnel = personnelStore.allPersonnel.filter(
    (p) => p.assignedPosition && p.rawCompletions && p.rawCompletions.length > 0
  );

  // For efficient lookup, create a map of every requirement name to its type
  const requirementTypeMap = new Map<string, RequirementType>();
  syllabiStore.allSyllabi.forEach((syllabus) => {
    syllabus.requirements.forEach((req) => {
      requirementTypeMap.set(req.name.toUpperCase(), req.type);
    });
  });

  // Group personnel by their assigned track
  const personnelByTrack = relevantPersonnel.reduce((acc, p) => {
    if (!acc[p.assignedPosition]) {
      acc[p.assignedPosition] = [];
    }
    acc[p.assignedPosition].push(p);
    return acc;
  }, {} as Record<string, Upgrader[]>);

  const trackSummaries: MonthlyTrackSummary[] = [];

  for (const [trackName, members] of Object.entries(personnelByTrack)) {
    let eventsCompletedThisMonth = 0;
    let pqsCompletedThisMonth = 0;

    members.forEach((member) => {
      const recentCompletions = member.rawCompletions.filter(
        (c) => new Date(c.date) >= thirtyDaysAgo
      );
      recentCompletions.forEach((completion) => {
        const reqType = requirementTypeMap.get(completion.event.toUpperCase());
        if (reqType === RequirementType.Event) {
          eventsCompletedThisMonth++;
        } else if (reqType === RequirementType.PQS) {
          pqsCompletedThisMonth++;
        }
      });
    });

    const summary: MonthlyTrackSummary = {
      trackName: trackName,
      totalEnrolled: members.length,
      numberBehind: members.filter(
        (m) => m.readinessAgainstDeadline === ReadinessStatus.BehindSchedule
      ).length,
      eventsCompletedThisMonth: eventsCompletedThisMonth,
      pqsCompletedThisMonth: pqsCompletedThisMonth,
    };
    trackSummaries.push(summary);
  }

  return {
    reportDate: today,
    startDate: thirtyDaysAgo,
    trackSummaries: trackSummaries.sort((a, b) =>
      a.trackName.localeCompare(b.trackName)
    ), // Sort tracks alphabetically
  };
}
