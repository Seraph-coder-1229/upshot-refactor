import { type Identifiable, type Named } from "./commonTypes";

export enum RequirementType {
  PQS = "PQS",
  Event = "Event",
  Other = "Other",
}

/**
 * Our internal, simplified categorization for a requirement,
 * which will be mapped from SHARP's 'Event Subtype'.
 */
export type RequirementTypeInternal = "PQS" | "Event" | "OtherWaived";

/**
 * Interface representing a single PQS item or Event (a training requirement).
 * This will be primarily populated from Sheet 3 of the SHARP Syllabus Export.
 */
export interface Requirement extends Identifiable, Named {
  // id: Should be a unique, stable identifier for this requirement.
  //     We'll likely construct this from SHARP's "Description" (which includes module numbers)
  //     potentially combined with elements from its parent syllabus (like syllabus name/version + level)
  //     to ensure system-wide uniqueness if item names are not unique across all syllabi/levels.
  // name: Will be the SHARP "Description" field (e.g., "Observer Refresher and Flight Line Safety Fundamentals - Module 92202").
  //       This is the primary field for matching against training completion records.
  // displayName: Will be SHARP's "Short Name" for UI purposes.

  /** The qualification level this requirement belongs to (e.g., 200, 300). */
  level: number;
  requirementType: RequirementTypeInternal; // Mapped from SHARP 'Event Subtype'.
  rawSharpEventSubtype?: string; // Store the original 'Event Subtype' string from SHARP for reference.

  prerequisites: string[]; // Array of standardized internal IDs of other Requirement objects.
  // These will be parsed from the newline-separated complex strings in SHARP's "Prerequisites" column.

  isMandatory?: boolean; // Derived from SHARP "Required" column (e.g., true if "Yes", false if "No").
  isDefaultWaived?: boolean; // Derived. True if rawSharpEventSubtype === 'OTHER QUAL' or if isMandatory === false.
  // This means the item is generally considered 'waived' for anyone on this syllabus.
  // Other potential metadata from SHARP Syllabus Export Sheet 3
  // stage?: string | null;
  // lessonCode?: string | null;
  // sortOrder?: number;
}

/**
 * Interface representing a distinct Syllabus for a given position, level, and year/version.
 * This will be primarily populated from Sheet 1 ("Syllabus and Stages") of the SHARP Syllabus Export,
 * and then associated with its requirements from Sheet 3.
 */
export interface Syllabus extends Identifiable, Named {
  // id: A unique identifier for this specific syllabus instance
  //     (e.g., "EWO-2025-L200" or "P8A_EWO_CORE_SYLLABUS_2025_V1.0-L200").
  // name: The "Syllabus Name" from SHARP Sheet 1 (e.g., "P-8A EWO CORE SYLLABUS 2025 v1.0").
  masterSyllabusIdentifier: string | null;
  position: string; // e.g., "PILOT", "NFO", "EWO", "AAW". (From Sheet 1 or inferred).
  level: number; // The ACTC Level this specific syllabus instance pertains to (e.g., 200, 300, 400).
  // Even if Sheet 1 lists multiple applicable levels for a document,
  // we'll likely create distinct Syllabus objects in memory per level.
  year: string; // Syllabus promulgation year (e.g., "2023", "2025"). From Sheet 1.
  version?: string; // Extracted from Syllabus Name on Sheet 1 or a dedicated column.

  pqsVersionRef?: string | null; // Matches "PQS VER" from SHARP Training Records Column B.
  // This helps link the syllabus to specific PQS documentation version. (From Sheet 1).

  requirements: Requirement[]; // All requirements (PQS & Events) that belong to this specific Syllabus (position, level, year).
  // Populated from Sheet 3 of the SHARP Syllabus Export.

  // Goal timeline properties (these define the *expected duration* for THIS specific syllabus/level)
  wingGoalMonths: number;
  squadronGoalMonths: number;
  goalStartMonthsOffset?: number; // Offset from an upgrader's effective start date for *this level*
  // to begin counting goal months for *this syllabus*.
  // E.g., L300 goals might start counting 12 months after upgrader's overall check-in.
}

export interface CompletedItemRecord {
  requirementId: string; // Matches Requirement.id (typically Requirement.name from syllabus definition)
  requirementDisplayName: string;
  requirementType: RequirementTypeInternal; // 'PQS', 'Event', or 'OtherWaived'

  completionDate: Date; // From SHARP "Date Received" sheet for this item
  instructor?: string | null; // From SHARP "Instructor" sheet
  grade?: string | number | null; // From SHARP "Grade" sheet
  statusRaw?: string | null; // Raw code from SHARP "Status" sheet cell (e.g., "PSO")
  statusResolved?: string | null; // Full description (e.g., "Pass - Signed Off", "Failed", "Waived")

  // How was this item 'completed' or addressed?
  isActualCompletion: boolean; // True if there's a completionDate and positive status (e.g., "Pass Signed Off")
  isSyllabusWaived?: boolean; // True if the Requirement.isDefaultWaived was true and no overriding SHARP status
  isIndividuallyWaived?: boolean; // True if SHARP status for this item specifically indicates "Waived" for this individual
}

// Global augmentation for window.UPSHOT_USER_SYLLABI (if not in a separate globals.d.ts)
declare global {
  interface Window {
    UPSHOT_USER_SYLLABI?: Syllabus[];
  }
}
