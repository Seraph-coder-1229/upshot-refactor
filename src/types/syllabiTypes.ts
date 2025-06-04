// src/types/syllabiTypes.ts
import { type Identifiable, type Named } from "./commonTypes";

export interface Requirement extends Identifiable, Named {
  // id will be requirement.name for uniqueness within a syllabus
  // name is the official/SHARP name
  // displayName is for UI
  prerequisites: string[]; // Array of other requirement 'name's (or 'id's)
  difficulty?: number; // User-assigned difficulty score/level
  isDefaultWaived?: boolean; // True if this item is generally waived for this syllabus by definition
  // category?: string; // e.g., "Systems", "Tactics", "Safety"
  // points?: number;
}

export interface Syllabus extends Identifiable, Named {
  // id could be a composite key: e.g., `${position}-${year}-l${level}-${type}`
  // name/title would be the user-friendly syllabus title (e.g., "PPC P8 PQS 2025")
  // displayName might be redundant if title is used.
  position: string; // e.g., "pilot", "nfo", "ewo", "awo", "AAW"
  level: number; // e.g., 200, 300, 400
  year: string; // Syllabus promulgation year, e.g., "2023", "2025"
  type: "pqs" | "events";
  pqsVersionRef?: string; // Matches "PQS VER" from SHARP Col B, if applicable for this syllabus
  requirements: Requirement[];

  // Goal timeline properties (these can be part of AppConfig or overridden here)
  wingGoalMonths: number;
  squadronGoalMonths: number;
  goalStartMonthsOffset?: number; // Default offset from upgrader start for goal curves
  // Can be overridden by specific wing/squadron start months below
  wingGoalStartMonthsOverride?: number;
  squadronGoalStartMonthsOverride?: number;
}

// Augment the global Window interface for user-provided syllabi
declare global {
  interface Window {
    UPSHOT_USER_SYLLABI?: Syllabus[];
  }
}
