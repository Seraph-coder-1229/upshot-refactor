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
  ProgressDataPoint,
} from "../types/reportTypes";
import { loggingService } from "../utils/loggingService";
import { ReadinessStatus, Upgrader } from "@/types/personnelTypes";
import { anonymizeData } from "@/utils/anonymizer";
import { addDays } from "date-fns";
import { daysBetween, getTodayUtc } from "@/utils/dateUtils";
import { RequirementType, Syllabus } from "@/types/syllabiTypes";
import { type PrioritizedRequirement } from "@/types/syllabiTypes";
import { type TrackOverview } from "@/types/reportTypes";
import { type LLMAnonymizedEventDetail } from "@/types/reportTypes";
const SVC_MODULE = "[ReportGenerator]";

/**
 * Generates the historical progress data points for line charts.
 */
function calculateProgressHistory(
  upgrader: Upgrader,
  syllabus: Syllabus,
  targetLevel: number // NEW: Explicitly pass the target level
): {
  pqsProgressHistory: ProgressDataPoint[];
  eventsProgressHistory: ProgressDataPoint[];
} {
  const pqsHistory: ProgressDataPoint[] = [];
  const eventsHistory: ProgressDataPoint[] = [];

  const startDate = new Date(upgrader.startDate);
  const today = new Date();
  const totalMonths =
    (today.getFullYear() - startDate.getFullYear()) * 12 +
    (today.getMonth() - startDate.getMonth());

  // --- START OF THE FIX ---
  // Filter the requirements to ONLY include those at or below the target level.
  const relevantRequirements = syllabus.requirements.filter(
    (req) => parseInt(req.level, 10) <= targetLevel
  );

  // Calculate totals based on the filtered, relevant requirements.
  const totalPqs = relevantRequirements.filter(
    (r) => r.type === RequirementType.PQS && !r.isDefaultWaived
  ).length;
  const totalEvents = relevantRequirements.filter(
    (r) => r.type === RequirementType.Event && !r.isDefaultWaived
  ).length;
  // --- END OF THE FIX ---

  for (let month = 0; month <= totalMonths; month++) {
    const currentDate = addDays(startDate, month * 30.44);

    const completionsByThisMonth = upgrader.allCompletions.filter(
      (c) => c.isActualCompletion && new Date(c.completionDate) <= currentDate
    );

    const pqsCompleted = completionsByThisMonth.filter(
      (c) => c.requirementType === RequirementType.PQS
    ).length;
    const eventsCompleted = completionsByThisMonth.filter(
      (c) => c.requirementType === RequirementType.Event
    ).length;

    if (totalPqs > 0) {
      pqsHistory.push({ x: month, y: (pqsCompleted / totalPqs) * 100 });
    }
    if (totalEvents > 0) {
      eventsHistory.push({
        x: month,
        y: (eventsCompleted / totalEvents) * 100,
      });
    }
  }

  return {
    pqsProgressHistory: pqsHistory,
    eventsProgressHistory: eventsHistory,
  };
}

function createInitialCategoryCount(): Record<ReadinessStatus, number> {
  const anEnum: any = ReadinessStatus;
  const record: Partial<Record<ReadinessStatus, number>> = {};
  for (const key in anEnum) {
    record[anEnum[key] as ReadinessStatus] = 0;
  }
  return record as Record<ReadinessStatus, number>;
}

export function generateTrackOverviewReport(trackName: string): TrackOverview {
  const personnelStore = usePersonnelStore();
  const syllabiStore = useSyllabiStore();

  const personnelInTrack = personnelStore.allPersonnel.filter(
    (p) => p.assignedPosition === trackName
  );

  const initialCategoryCount = createInitialCategoryCount();

  if (personnelInTrack.length === 0) {
    // Return a default/empty state if no personnel are in the track
    return {
      trackName,
      totalPersonnel: 0,
      personnelCountByLevel: {},
      personnelCountByCategory: initialCategoryCount,
      trackHealthScore: 0,
      priorityStudentsByLevel: {},
      totalEventsToMeetDeadline: 0,
      totalPqsToMeetDeadline: 0,
      nextMonthPriorityEvents: [],
    };
  }

  // Calculations
  const totalPersonnel = personnelInTrack.length;

  const personnelCountByLevel = personnelInTrack.reduce((acc, p) => {
    const level = p.derivedPqsWorkingLevel || "N/A";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const personnelCountByCategory = personnelInTrack.reduce((acc, p) => {
    const category = p.readinessAgainstDeadline || ReadinessStatus.Unknown;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, initialCategoryCount);

  const pctOnTrack =
    (personnelCountByCategory[ReadinessStatus.OnTrack] || 0) / totalPersonnel;
  const pctAtRisk =
    (personnelCountByCategory[ReadinessStatus.AtRisk] || 0) / totalPersonnel;
  const pctBehind =
    (personnelCountByCategory[ReadinessStatus.BehindSchedule] || 0) /
    totalPersonnel;
  const pctBlocked =
    (personnelCountByCategory[ReadinessStatus.Blocked] || 0) / totalPersonnel;

  const rawHealthScore =
    1.0 * pctOnTrack + 0.5 * pctAtRisk - 0.75 * pctBehind - 1.5 * pctBlocked;
  // Scale score from [-1.5, 1] to [0, 100]
  const trackHealthScore = Math.max(
    0,
    Math.min(100, ((rawHealthScore + 1.5) / 2.5) * 100)
  );

  const priorityStudentsByLevel = personnelInTrack
    .filter((p) =>
      [
        ReadinessStatus.AtRisk,
        ReadinessStatus.BehindSchedule,
        ReadinessStatus.Blocked,
      ].includes(p.readinessAgainstDeadline!)
    )
    .sort(
      (a, b) =>
        (a.pacingAgainstDeadlineDays ?? 0) - (b.pacingAgainstDeadlineDays ?? 0)
    )
    .reduce((acc, p) => {
      const level = p.derivedPqsWorkingLevel || "N/A";
      if (!acc[level]) {
        acc[level] = [];
      }
      if (acc[level].length < 5) {
        acc[level].push(p);
      }
      return acc;
    }, {} as Record<string, Upgrader[]>);

  const totalEventsToMeetDeadline = personnelInTrack.reduce(
    (sum, p) => sum + (p.eventsToMeetDeadline || 0),
    0
  );
  const totalPqsToMeetDeadline = personnelInTrack.reduce(
    (sum, p) => sum + (p.pqsToMeetDeadline || 0),
    0
  );

  const allPriorityEvents = personnelInTrack.flatMap((p) => {
    const syllabus = syllabiStore.findSyllabus(
      p.assignedPosition,
      p.assignedSyllabusYear
    );
    return syllabus ? getPrioritizedRequirements(p, syllabus) : [];
  });

  const eventFrequency = allPriorityEvents
    .filter((event) => event.isAvailable)
    .reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const uniqueEvents = Array.from(new Set(allPriorityEvents.map((e) => e.name)))
    .map((name) => allPriorityEvents.find((e) => e.name === name)!)
    .sort(
      (a, b) => (eventFrequency[b.name] || 0) - (eventFrequency[a.name] || 0)
    );

  const nextMonthPriorityEvents = uniqueEvents.slice(0, 10);

  return {
    trackName,
    totalPersonnel,
    personnelCountByLevel,
    personnelCountByCategory,
    trackHealthScore,
    priorityStudentsByLevel,
    totalEventsToMeetDeadline,
    totalPqsToMeetDeadline,
    nextMonthPriorityEvents,
  };
}

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
 */
export function generateIndividualReport(
  upgraderId: string
): IndividualReport | null {
  const personnelStore = usePersonnelStore();
  const syllabiStore = useSyllabiStore();

  const upgrader = personnelStore.getPersonnelById(upgraderId);
  if (!upgrader) {
    loggingService.logError(
      `${SVC_MODULE} Could not find upgrader with id: ${upgraderId}`
    );
    return null;
  }

  const fullSyllabus = syllabiStore.findSyllabus(
    upgrader.assignedPosition,
    upgrader.assignedSyllabusYear
  );

  if (!fullSyllabus) {
    loggingService.logError(
      `${SVC_MODULE} Could not find syllabus for ${upgrader.displayName}`
    );
    return null;
  }

  // --- START OF THE FIX ---
  // Create a new syllabus object that is scoped to the upgrader's target level.
  const targetLevel = upgrader.targetQualificationLevel;
  const scopedSyllabus: Syllabus = {
    ...fullSyllabus,
    requirements: fullSyllabus.requirements.filter(
      (req) => parseInt(req.level, 10) <= targetLevel
    ),
  };
  // --- END OF THE FIX ---

  // Now, use the new `scopedSyllabus` for all report calculations.
  const priorityTasks = getPrioritizedRequirements(upgrader, scopedSyllabus);
  const { pqsProgressHistory, eventsProgressHistory } =
    calculateProgressHistory(
      upgrader,
      scopedSyllabus,
      upgrader.targetQualificationLevel
    );

  const report: IndividualReport = {
    upgrader,
    summary: {
      readinessAgainstDeadline:
        upgrader.readinessAgainstDeadline ?? ReadinessStatus.Unknown,
      pacingAgainstDeadlineDays: upgrader.pacingAgainstDeadlineDays ?? 0,
      projectedCompletionDate: upgrader.projectedTotalCompletionDate,
    },
    priorityTasks,
    allCompletions: upgrader.allCompletions,
    pqsProgressHistory,
    eventsProgressHistory,
  };

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
