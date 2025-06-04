// Types for structured report data (LLM output, etc.)
// src/types/reportTypes.ts

export interface LLMUpgraderEventDetail {
    itemName: string;
    completionDate?: string; // YYYY-MM-DD
    status?: string;
    difficulty?: number;
    prerequisitesMet?: boolean;
    missingPrerequisites?: string[];
    dueDate?: string; // YYYY-MM-DD
  }
  
  export interface LLMUpgraderReportData {
    upgraderId: string;
    upgraderDisplayName: string;
    assignedPosition: string;
    currentPqsWorkingLevel?: number;
    currentEventsWorkingLevel?: number;
    overallStatus: 'on_track' | 'ahead' | 'behind' | 'at_risk' | 'complete' | 'data_pending';
    summaryStatement?: string; // AI can generate based on this
    completedLastMonth: LLMUpgraderEventDetail[];
    upcomingPriorities: LLMUpgraderEventDetail[];
    blockers?: LLMUpgraderEventDetail[]; // Items they are stuck on due to prereqs
    notesForLLM?: string; // Specific prompts or context for this upgrader
  }
  
  export interface LLMPositionLevelReportData {
    position: string;
    level: number;
    overallTrackSummary?: string;
    upgraderReports: LLMUpgraderReportData[];
  }
  
  export interface LLMMultiTrackMonthlyReport {
    reportGeneratedDate: string; // YYYY-MM-DD
    overallOrganisationalSummary?: string;
    positionLevelReports: LLMPositionLevelReportData[];
  }