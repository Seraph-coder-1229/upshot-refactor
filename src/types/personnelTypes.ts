import { type Identifiable, type Named } from "./commonTypes";
import { type CompletedItemRecord } from "./syllabiTypes"; // Or move CompletedItemRecord to commonTypes if used more broadly

export interface Upgrader extends Identifiable, Named {
  // id: SHARP Name ("LAST, FIRST M")
  // name: SHARP Name
  // displayName: For UI (from Personnel Excel)

  rank?: string;
  designator?: string;
  startDate: Date; // Check-in date (UTC)

  // From Personnel Excel
  assignedPosition: string; // e.g., "EWO", "PILOT"
  assignedSyllabusYear: string; // e.g., "2023", "2025"
  targetQualificationLevel: number; // e.g., 200, 300, 400

  // From SHARP Excel (Column B "PQS VER")
  currentSharpPqsVersion?: string | null;

  // Overall status/date for each ACTC level from SHARP "ACTC Lvl" columns
  actcLevelData?: {
    [level: number]: {
      // e.g., 200, 300, 400
      dateReceived?: Date | null;
      instructor?: string | null;
      grade?: string | number | null;
      status?: string | null; // Resolved status string
      isActive?: boolean; // Derived from status
    };
  };

  // Dynamically calculated by progressStore/trainingLogicService
  derivedPqsWorkingLevel?: number;
  derivedEventsWorkingLevel?: number;

  // All known completions for this upgrader, across all relevant syllabi/levels.
  // Populated by progressStore. This flat list is useful for prerequisite checking.
  allCompletions: CompletedItemRecord[];
}
