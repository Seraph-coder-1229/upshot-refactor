import { type Identifiable, type Named } from "./commonTypes";
import { type CompletedItemRecord } from "./syllabiTypes"; // Or move CompletedItemRecord to commonTypes if used more broadly

/**
 * Represents an upgrader (personnel).
 * Combines information from the user-managed Personnel Excel file and
 * dynamically processed data from SHARP reports.
 */
export interface Upgrader extends Identifiable, Named {
  // id: Will be the unique SHARP Name ("LAST, FIRST M") used for matching.
  // name: Also the SHARP Name.
  // displayName: For UI display (primarily from Personnel Excel).

  rank?: string; // From SHARP data (Column B "Rank" - based on original datereceieved.PNG)
  // If SHARP Col B is now "PQS VER", rank might come from Personnel File or not be tracked.
  designator?: string; // From SHARP data (Column C "Desig" - based on original datereceieved.PNG)
  // If SHARP Col C is now "ACTC 200", desig might come from Personnel File or not be tracked.
  startDate: Date; // Check-in date (from Personnel Excel, parsed to UTC Date)

  // Information from the Personnel Excel file:
  assignedPosition: string; // e.g., "EWO", "PILOT" (used to select base syllabi)
  assignedSyllabusYear: string; // e.g., "2023", "2025" (used to select base syllabi)
  targetQualificationLevel: number; // e.g., 200, 300, 400 (their ultimate qualification goal for this career phase)
  // currentPqsFromPersonnelFile?: string; // Original field mentioned for Personnel File (maps to currentSharpPqsVersion or target?)
  // l200StatusFromPersonnelFile?: string; // Original field mentioned for Personnel File

  // Information derived from SHARP Excel data processing:
  currentSharpPqsVersion?: string | null; // From SHARP Column B ("PQS VER")

  // Stores overall status/date for each ACTC level from SHARP "ACTC Lvl" columns
  // (e.g., "ACTC 200" in Col C, "ACTC 300" in Col X, "ACTC 400" in Col Y)
  actcLevelData?: {
    [level: number]: {
      // e.g., 200, 300, 400
      dateReceived?: Date | null; // From "Date Received" sheet's "ACTC Lvl" column
      instructor?: string | null; // From "Instructor" sheet's "ACTC Lvl" column
      grade?: string | number | null; // From "Grade" sheet's "ACTC Lvl" column
      status?: string | null; // From "Status" sheet's "ACTC Lvl" column (resolved string)
      isActive?: boolean; // Derived from status like "ACTIVE" in SHARP for that level
    };
  };

  // Dynamically calculated "working" levels based on completions and progression rules
  derivedPqsWorkingLevel?: number;
  derivedEventsWorkingLevel?: number;

  // All known completions for this upgrader, across all relevant syllabi/levels.
  // Populated by progressStore. This flat list is useful for prerequisite checking.
  allCompletions: CompletedItemRecord[];
}
