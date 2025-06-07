import { type Identifiable, type Named } from "./commonTypes";

/**
 * The definitive enumeration for requirement types.
 */
export enum RequirementType {
  PQS = "PQS",
  Event = "Event",
  Other = "Other",
}

/**
 * Represents a single requirement or event within a syllabus.
 */
export interface Requirement extends Identifiable, Named {
  /** The qualification level this requirement belongs to (e.g., 200, 300). */
  level: number;

  /** The type of this requirement, used for filtering and logic. */
  type: RequirementType;

  /** A list of other requirement 'name's that must be completed before this one. */
  prerequisites?: string[];

  /** An optional difficulty rating for the requirement. */
  difficulty?: number;

  /** Whether this requirement is typically waived by default. */
  isDefaultWaived?: boolean;

  // Other properties from your file are kept for your use
  rawSharpEventSubtype?: string;
  squadronGoalMonths?: number;
  goalStartMonthsOffset?: number;
}

/**
 * Represents a full syllabus for a given position and year.
 */
export interface Syllabus extends Identifiable, Named {
  position: string;
  year: string;
  displayName: string;

  /** The base qualification level for this syllabus (e.g., 200). */
  baseLevel: number;

  /** The full list of requirements for this syllabus. */
  requirements: Requirement[];

  masterSyllabusIdentifier: string | null;
}

/**
 * Represents a completion record that has been successfully
 * resolved against a specific syllabus requirement.
 */
export interface CompletedItemRecord {
  requirementId: string;
  requirementDisplayName: string;
  requirementType: RequirementType; // Standardized to use the enum
  completionDate: Date;
  instructor?: string | null;
  grade?: string | number | null;
  statusRaw?: string | null;
  statusResolved?: string | null;
  isActualCompletion: boolean;
  isSyllabusWaived?: boolean;
  isIndividuallyWaived?: boolean;
}

// Global augmentation for window.UPSHOT_USER_SYLLABI (if not in a separate globals.d.ts)
declare global {
  interface Window {
    UPSHOT_USER_SYLLABI?: Syllabus[];
  }
}
