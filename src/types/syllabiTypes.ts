import { type Identifiable, type Named } from "./commonTypes";

export enum RequirementType {
  PQS = "PQS",
  Event = "Event",
  Board = "Board",
  Other = "Other",
}

export interface Requirement extends Identifiable, Named {
  id: string; // Should be the "Short Name" for matching
  name: string; // Should also be the "Short Name"
  displayName: string;
  description: string; // The "Long name" from the syllabus file
  level: string; // Can be "200", "300", "400MC", etc.
  type: RequirementType;
  sequence?: number;
  prerequisites?: string[];
  isDefaultWaived: boolean;
  rawSharpEventSubtype?: string;
  difficulty?: number;
}

export interface Syllabus extends Identifiable, Named {
  id: string;
  name: string;
  displayName: string;
  position: string;
  year: string;
  baseLevel: string; // The starting level, e.g., "200"
  requirements: Requirement[];
  masterSyllabusIdentifier: string | null;
}

export interface PrioritizedRequirement extends Requirement {
  priorityScore: number;
  isAvailable: boolean;
  unlocks: number;
}

/**
 * Represents a completion record that has been successfully
 * resolved against a specific syllabus requirement.
 */
export interface CompletedItemRecord {
  requirementId: string;
  requirementDisplayName: string;
  requirementType: RequirementType;
  completionDate: Date;
  instructor?: string | null;
  grade?: string | number | null;
  statusRaw?: string | null;
  statusResolved?: string | null;
  isActualCompletion: boolean;
  isSyllabusWaived?: boolean;
  isIndividuallyWaived?: boolean;
}

/**
 * Extends the base Requirement type with additional, dynamically calculated
 * properties related to its priority for a specific upgrader.
 */
export interface PrioritizedRequirement extends Requirement {
  priorityScore: number;
  isAvailable: boolean; // Is the requirement available to be worked on now?
  unlocks: number; // How many other requirements does this unlock?
}

// Global augmentation for window object
declare global {
  interface Window {
    UPSHOT_USER_SYLLABI: Syllabus[];
  }
}
