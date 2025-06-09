/**
 * @file This service is responsible for generating structured report data.
 * It acts as an orchestrator, pulling data from various stores and using
 * logic services to assemble final, presentation-ready report objects.
 */

import { usePersonnelStore } from "../stores/personnelStore";
import { useSyllabiStore } from "../stores/syllabiStore";
import { getPrioritizedRequirements } from "./trainingLogicService";
import { type IndividualReport } from "../types/reportTypes";
import { loggingService } from "../utils/loggingService";
import { ReadinessStatus } from "@/types/personnelTypes";

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

  // 1. Get the upgrader's data from the store.
  const upgrader = personnelStore.getPersonnelById(upgraderId);
  if (!upgrader) {
    loggingService.logError(
      `${SVC_MODULE} Could not find upgrader with ID: ${upgraderId}`
    );
    return null;
  }

  // 2. Find their assigned syllabus.
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

  // 3. Call our existing logic services to get calculated data.
  const priorityTasks = getPrioritizedRequirements(upgrader, syllabus);

  // 4. Assemble the final report object.
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
