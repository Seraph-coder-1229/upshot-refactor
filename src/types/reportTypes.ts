import { ReadinessStatus, Upgrader } from "./personnelTypes";
import {
  CompletedItemRecord,
  PrioritizedRequirement,
  Requirement,
  type RequirementType,
} from "./syllabiTypes";

export interface ReportSummary {
  readinessAgainstDeadline: ReadinessStatus;
  pacingAgainstDeadlineDays: number;
  projectedCompletionDate?: Date;
}

export interface ChartDataPoint {
  x: number;
  y: number;
}

export interface ReportGraphLines {
  pqsHistory: {
    progress: ChartDataPoint[];
    target: ChartDataPoint[];
    deadline: ChartDataPoint[];
  };
  eventsHistory: {
    progress: ChartDataPoint[];
    target: ChartDataPoint[];
    deadline: ChartDataPoint[];
  };
}

export interface IndividualReport {
  upgrader: Upgrader;
  summary: ReportSummary;
  priorityTasks: PrioritizedRequirement[];
  allCompletions: CompletedItemRecord[];
  pqsProgressHistory: ReportGraphLines;
}

/**
 * Defines the summary statistics for a single track for the monthly report.
 * (This existing type is unchanged)
 */
export interface MonthlyTrackSummary {
  trackName: string;
  totalEnrolled: number;
  numberBehind: number;
  eventsCompletedThisMonth: number;
  pqsCompletedThisMonth: number;
}

/**
 * NEW: Defines the structure for the new high-level summary statistics.
 */
export interface MonthlySummaryStats {
  trackHealthPercentage: number;
  averageCostFactor: number;
  totalEventsNeededThisMonth: number;
  totalPqsNeededThisMonth: number;
  upgradersOnTrack: number;
  totalUpgraders: number;
}

/**
 * NEW: Defines the structure for a prioritized task, including the upgrader's name and score.
 */
export interface MonthlyPriorityTask extends Requirement {
  upgraderName: string;
  priorityScore: number;
}

/**
 * REVISED: The overall structure for the monthly report data is extended
 * to include the new summary stats and priority task lists.
 */
export interface MonthlyReportData {
  reportDate: Date;
  startDate: Date; // The date 30 days ago
  trackSummaries: MonthlyTrackSummary[]; // Existing data is preserved

  // NEW FIELDS
  summaryStats: MonthlySummaryStats;
  priorityTasks: {
    pqs: MonthlyPriorityTask[];
    boards: MonthlyPriorityTask[];
    events: MonthlyPriorityTask[];
  };
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

/**
 * Defines the summary statistics for a single track for the monthly report.
 */
export interface MonthlyTrackSummary {
  trackName: string;
  totalEnrolled: number;
  numberBehind: number;
  eventsCompletedThisMonth: number;
  pqsCompletedThisMonth: number;
}

/**
 * Defines the overall structure for the monthly report data.
 */
export interface MonthlyReportData {
  reportDate: Date;
  startDate: Date; // The date 30 days ago
  trackSummaries: MonthlyTrackSummary[];
}

export interface TrackOverview {
  trackName: string;
  totalPersonnel: number;
  personnelCountByLevel: Record<string, number>; // e.g., { "200": 5, "300": 10 }
  personnelCountByCategory: Record<ReadinessStatus, number>; // e.g., { "On Track": 8, ... }
  trackHealthScore: number; // Score from 0-100
  priorityStudentsByLevel: Record<string, Upgrader[]>; // Top 5 at-risk/behind students per level
  totalEventsToMeetDeadline: number; // Sum of eventsToMeetDeadline for all upgraders
  totalPqsToMeetDeadline: number; // Sum of pqsToMeetDeadline for all upgraders
  nextMonthPriorityEvents: PrioritizedRequirement[]; // Top 5-10 upcoming events
}

/**
 * Represents a single data point for progress over time.
 * x: Months since the start date.
 * y: Cumulative progress percentage at that month.
 */
export interface ProgressDataPoint {
  x: number;
  y: number;
}

/**
 * Represents the data packet required by the Track Report PDF generation service.
 * This data is assembled from the computed properties in TrackReportView.vue.
 */
export interface TrackReportPdfData {
  selectedPosition: string;
  healthSummary: {
    total: number;
    blocked: number;
    behind: number;
    atRisk: number;
    readyForNext: number;
  };
  priorityUpgraders: Upgrader[];
  filteredUpgraders: Upgrader[];
  // We will omit the chart data for now as generating dynamic charts in a PDF is complex
  // and can be added later if needed. The tabular data is the highest priority.
}
