import { ReadinessStatus, Upgrader } from "./personnelTypes";
import { PrioritizedRequirement, type RequirementType } from "./syllabiTypes";

export interface IndividualReport {
  upgrader: Upgrader; // The full, up-to-date upgrader object

  summary: {
    readinessAgainstDeadline: ReadinessStatus;
    pacingAgainstDeadlineDays: number;
    projectedCompletionDate?: Date;
  };

  // The prioritized "to-do list" from our logic service
  priorityTasks: PrioritizedRequirement[];
}

export interface TrackReport {
  position: string;
  year: string;

  // The "watch list" of upgraders needing the most attention
  prioritizedUpgraders: (Upgrader & { priorityScore: number })[];

  summaryStats: {
    totalPersonnel: number;
    numberOnTrack: number;
    numberAtRisk: number;
    numberBehind: number;
    numberBlocked: number;
  };
}
/**
 * Anonymized detail for an event/PQS item for LLM.
 */
export interface LLMAnonymizedEventDetail {
  itemName: string;
  requirementType: RequirementType;
  status?: string | null;
  difficulty?: number | null;
  prerequisitesMet?: boolean;
}

/**
 * Anonymized report data for a single upgrader.
 */
export interface LLMAnonymizedUpgraderReportData {
  anonymizedUpgraderId: string; // HASHED version of Upgrader.id
  assignedPosition: string;
  currentPqsWorkingLevel?: string;
  currentEventsWorkingLevel?: string;
  overallStatus:
    | "on_track"
    | "ahead"
    | "behind"
    | "at_risk"
    | "complete"
    | "data_pending"
    | "not_started"
    | "blocked";
  summaryPoints?: string[];
  completedLastMonthCount?: number;
  upcomingPriorityItemCount?: number;
  blockerCount?: number;
  notesForLLMContext?: string;
}

/**
 * Data for LLM report, focusing on a specific position and ACTC level.
 */
export interface LLMAnonymizedPositionLevelReportData {
  positionName: string;
  level: number;
  overallLevelSummaryPoints?: string[];
  upgraderReports: LLMAnonymizedUpgraderReportData[];
}

/**
 * Anonymized structure for the comprehensive multi-track/multi-position monthly report for LLM.
 */
export interface LLMAnonymizedMultiPositionMonthlyReport {
  reportGeneratedDate: string; // YYYY-MM-DD
  overallOrganisationalSummaryPoints?: string[];
  positions: LLMAnonymizedPositionLevelReportData[];
}
