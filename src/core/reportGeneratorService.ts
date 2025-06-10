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
} from "../types/reportTypes";
import { loggingService } from "../utils/loggingService";
import { getAnonymizedUpgraderId } from "../utils/anonymizer";
import { ReadinessStatus, Upgrader } from "@/types/personnelTypes";

const SVC_MODULE = "[ReportGenerator]";

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
  const syllabiStore = useSyllabiStore();

  const upgrader = personnelStore.getPersonnelById(upgraderId);
  if (!upgrader) {
    loggingService.logError(
      `${SVC_MODULE} Could not find upgrader with ID: ${upgraderId}`
    );
    return null;
  }

  const syllabus = syllabiStore.findSyllabus(
    upgrader.assignedPosition,
    upgrader.assignedSyllabusYear
  );
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
 */
export async function generateLLMMultiTrackMonthlyReport(): Promise<LLMAnonymizedMultiPositionMonthlyReport> {
  const personnelStore = usePersonnelStore();
  const allPersonnel = personnelStore.allPersonnel;

  const positionGroups = allPersonnel.reduce((acc, p) => {
    const key = `${p.assignedPosition}_${p.targetQualificationLevel}`;
    if (!acc[key]) {
      acc[key] = {
        positionName: p.assignedPosition,
        level: p.targetQualificationLevel,
        upgraderReports: [],
      };
    }
    acc[key].upgraderReports.push(p);
    return acc;
  }, {} as Record<string, { positionName: string; level: number; upgraderReports: Upgrader[] }>);

  const positionReports: LLMAnonymizedPositionLevelReportData[] = [];

  for (const group of Object.values(positionGroups)) {
    const upgraderReports: LLMAnonymizedUpgraderReportData[] = [];
    for (const upgrader of group.upgraderReports) {
      const anonId = await getAnonymizedUpgraderId(upgrader.id);

      let status: LLMAnonymizedUpgraderReportData["overallStatus"] =
        "data_pending";
      if (upgrader.readinessAgainstDeadline) {
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
          case ReadinessStatus.ReadyForNextLevel:
            status = "complete";
            break;
        }
      }

      const reportData: LLMAnonymizedUpgraderReportData = {
        anonymizedUpgraderId: anonId,
        assignedPosition: upgrader.assignedPosition,
        currentPqsWorkingLevel: upgrader.derivedPqsWorkingLevel,
        currentEventsWorkingLevel: upgrader.derivedEventsWorkingLevel,
        overallStatus: status,
        summaryPoints: [
          `Pacing: ${upgrader.pacingAgainstDeadlineDays ?? "N/A"} days`,
          `PQS Progress (current level): ${
            upgrader.pqsProgressPercentage?.toFixed(0) ?? "N/A"
          }%`,
          `Event Progress (current level): ${
            upgrader.eventsProgressPercentage?.toFixed(0) ?? "N/A"
          }%`,
        ],
      };
      upgraderReports.push(reportData);
    }
    positionReports.push({
      positionName: group.positionName,
      level: group.level,
      upgraderReports: upgraderReports,
    });
  }

  return {
    reportGeneratedDate: new Date().toISOString().split("T")[0],
    positions: positionReports,
  };
}
