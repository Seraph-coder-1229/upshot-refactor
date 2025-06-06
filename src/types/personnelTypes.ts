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
  displayName: string; // For UI display (from Personnel Excel).

  rank?: string;
  designator?: string; // This can be populated from SHARP later if needed.
  startDate: Date;

  // Information from the Personnel Excel file:
  assignedPosition: string;
  assignedSyllabusYear: string;
  targetQualificationLevel: number;
  onWaiver?: boolean; // Is the member currently on a waiver?

  // Information derived from SHARP Excel data processing:
  currentSharpPqsVersion?: string | null;
  actcLevelData?: {
    [level: number]: {
      dateReceived?: Date | null;
      instructor?: string | null;
      grade?: string | number | null;
      status?: string | null;
      isActive?: boolean;
    };
  };

  // Dynamically calculated levels
  derivedPqsWorkingLevel?: number;
  derivedEventsWorkingLevel?: number;

  // All completions for this upgrader.
  allCompletions: CompletedItemRecord[];
}
