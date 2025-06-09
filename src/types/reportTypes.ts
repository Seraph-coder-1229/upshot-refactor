// src/types/reportTypes.ts
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
  itemName: string; // Requirement.displayName or Requirement.name (these are syllabus items, generally not PII)
  requirementType: RequirementType;
  // completionDate?: string;      // Consider if exact dates are too revealing in context. Relative (e.g., "completed last month") might be better.
  status?: string | null; // e.g., "Pass - Signed Off", "Failed", "Waived"
  difficulty?: number | null;
  prerequisitesMet?: boolean;
  // missingPrerequisites?: string[];// List of item names (again, syllabus items)
  // projectedReadyDate?: string | null;
}

/**
 * Anonymized report data for a single upgrader.
 */
export interface LLMAnonymizedUpgraderReportData {
  anonymizedUpgraderId: string; // HASHED version of Upgrader.id
  assignedPosition: string; // e.g., "PILOT", "NFO" (if deemed non-sensitive)
  currentPqsWorkingLevel?: number;
  currentEventsWorkingLevel?: number;
  overallStatus:
    | "on_track"
    | "ahead"
    | "behind"
    | "at_risk"
    | "complete"
    | "data_pending"
    | "not_started";
  summaryPoints?: string[]; // Bullet points of key observations for LLM to expand upon
  completedLastMonthCount?: number; // Count instead of list of names for more privacy
  upcomingPriorityItemCount?: number;
  blockerCount?: number;
  notesForLLMContext?: string; // Generic context without PII
}

/**
 * Data for LLM report, focusing on a specific position and ACTC level.
 */
export interface LLMAnonymizedPositionLevelReportData {
  positionName: string; // e.g., "PILOT"
  level: number;
  overallLevelSummaryPoints?: string[];
  upgraderReports: LLMAnonymizedUpgraderReportData[];
}

/**
 * Anonymized structure for the comprehensive multi-track/multi-position monthly report for LLM.
 */
export interface LLMAnonymizedMultiPositionMonthlyReport {
  reportGeneratedDate: string; // YYYY-MM-DD
  overallOrganisationalSummaryPoints?: string[]; // Key summary points for LLM
  positions: LLMAnonymizedPositionLevelReportData[];
}
