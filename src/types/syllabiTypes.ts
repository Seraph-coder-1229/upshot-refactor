import { type Identifiable, type Named } from "./commonTypes";

export type RequirementType = "PQS" | "Event";

export interface Requirement extends Identifiable, Named {
  requirementType: RequirementType;
  prerequisites: string[]; // Array of other requirement 'name's (or 'id's)
  difficulty?: number;
  isDefaultWaived?: boolean;
}

export interface Syllabus extends Identifiable, Named {
  position: string;
  level: number;
  year: string;
  // 'type' (pqs/events) is now on Requirement
  pqsVersionRef?: string;
  requirements: Requirement[];
  wingGoalMonths: number;
  squadronGoalMonths: number;
  goalStartMonthsOffset?: number;
}

// This record links a Requirement from a Syllabus to actual completion data
export interface CompletedItemRecord {
  requirementId: string; // Matches Requirement.id (or Requirement.name)
  requirementDisplayName: string;
  requirementType: RequirementType; // 'PQS' or 'Event'

  completionDate: Date; // From SHARP "Date Received" sheet
  instructor?: string | null; // From SHARP "Instructor" sheet
  grade?: string | number | null; // From SHARP "Grade" sheet
  statusRaw?: string | null; // Raw code from SHARP "Status" sheet cell (e.g., "PSO")
  statusResolved?: string | null; // Full description (e.g., "Pass - Signed Off", "Failed", "Waived")

  // How was this item 'completed'?
  isActualCompletion: boolean; // True if there's a completionDate and positive status
  isSyllabusWaived?: boolean; // True if Requirement.isDefaultWaived and no contradictory SHARP status
  isIndividuallyWaived?: boolean; // True if SHARP status specifically indicates "Waived"
}

// Global augmentation for window.UPSHOT_USER_SYLLABI (if not in a separate globals.d.ts)
declare global {
  interface Window {
    UPSHOT_USER_SYLLABI?: Syllabus[];
  }
}
