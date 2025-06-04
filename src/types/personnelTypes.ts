// src/types/personnelTypes.ts
import { type Identifiable, type Named } from "./commonTypes";

// From SHARP data for a specific event/pqs item
export interface RawCompletionData {
  sharpEventName: string; // Header name from SHARP
  completionDate?: Date | null;
  instructor?: string | null;
  grade?: string | number | null;
  statusRaw?: string | null; // e.g., "PSO", "IP"
  statusResolved?: string | null; // e.g., "Pass - Signed Off", "In Progress"
}

// Represents a syllabus item an upgrader has completed
export interface CompletedItemRecord {
  requirementId: string; // Links to Requirement.id (which is Requirement.name)
  requirementDisplayName: string;
  completionDate: Date;
  instructor?: string | null;
  grade?: string | number | null;
  statusResolved?: string | null;
  isWaived?: boolean; // True if this specific completion was due to a syllabus waiver
  // other relevant completion details
}

// Represents an upgrader (personnel)
export interface Upgrader extends Identifiable, Named {
  // id will be the unique SHARP Name ("LAST, FIRST M")
  // name is also SHARP Name
  // displayName is for UI
  rank?: string;
  designator?: string; // From SHARP C column
  startDate: Date; // Check-in date

  // From Personnel File - user's declared target/assignment
  assignedPosition: string;
  assignedSyllabusYear: string;
  targetQualificationLevel: number; // e.g., 200, 300, 400 (their ultimate goal for this career phase)
  initialL200Status?: string; // From Personnel file Column A if it exists
  initialPqsDesignator?: string; // From Personnel file Column B if it exists (might match Syllabus.pqsVersionRef)

  // Dynamically determined from SHARP data
  currentSharpPqsVersion?: string; // From SHARP Column B
  actcLevelData?: {
    // Data from SHARP "ACTC Lvl" columns
    [level: number]: {
      // e.g., 200, 300, 400
      date?: Date | null; // From "Date Received" sheet for the "ACTC Lvl" column
      status?: string | null; // From "Status" sheet for the "ACTC Lvl" column
      instructor?: string | null; // From "Instructor" sheet for the "ACTC Lvl" column
      grade?: string | null; // From "Grade" sheet for the "ACTC Lvl" column
      isActive?: boolean; // Derived from the status string like "ACTIVE"
    };
  };

  // Dynamically calculated "working" levels based on completions and rules
  derivedPqsWorkingLevel?: number;
  derivedEventsWorkingLevel?: number;

  // Processed completion data, keyed by syllabusId for multi-syllabus tracking
  progress?: Map<
    string,
    {
      // Key: Syllabus ID
      itemsCompleted: CompletedItemRecord[];
      itemsLeft: string[]; // Array of requirement IDs/names
      // ... other progress metrics for this syllabus
    }
  >;

  // Could also have a flat list of all completions for easier prerequisite checking
  allCompletions?: CompletedItemRecord[];
}
