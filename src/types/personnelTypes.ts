import { type Identifiable, type Named } from "./commonTypes";
import { type CompletedItemRecord } from "./syllabiTypes";
import { type DetailedCompletionRecord } from "../core/excelProcessorServices/trainingDataProcessorService";

/**
 * Represents an upgrader (a person undergoing training).
 * This is the central data object for an individual, combining information
 * from user-managed files (Personnel Excel) and dynamically processed data
 * from SHARP reports.
 */
export interface Upgrader extends Identifiable, Named {
  // =================================================================
  // SECTION 1: CORE IDENTITY
  // =================================================================

  /** The unique ID, which MUST be the official SHARP Name (e.g., "LAST, FIRST M"). */
  id: string;

  /** Also the official SHARP Name, used for matching. */
  name: string;

  /** The name for display in the UI (e.g., "Jane Doe"). */
  displayName: string;

  /** The person's rank (e.g., "LT", "LCDR"). */
  rank?: string;

  /** The person's designator. */
  designator?: string;

  /** The person's check-in or start date. */
  startDate: Date;

  // =================================================================
  // SECTION 2: USER-MANAGED GOALS (from Personnel Excel)
  // =================================================================

  /** The position or track that determines the person's syllabus (e.g., "PILOT", "EWO"). */
  assignedPosition: string;

  /** The year of the syllabus assigned to the person (e.g., "2023"). */
  assignedSyllabusYear: string;

  /** The ultimate qualification level this person is aiming for (e.g., 200, 300). */
  targetQualificationLevel: number;

  /** Whether the person is currently on a waiver. */
  onWaiver?: boolean;

  // =================================================================
  // SECTION 3: SHARP-DERIVED DATA (from SHARP Excel)
  // =================================================================

  /** The name of the PQS from the header of the processed SHARP file. */
  currentSharpPqsVersion?: string | null;

  /** The status of the overall PQS for this person (e.g., "Active", "Inactive"). */
  pqsVersionStatus?: string | null;

  /** Holds the status for major ACTC qualification milestones (e.g., 200, 300). */
  actcLevelData?: {
    [level: number]: {
      status?: string | null;
    };
  };

  /** An array holding all raw event completion records for this person. */
  rawCompletions: DetailedCompletionRecord[];

  // =================================================================
  // SECTION 4: APPLICATION-CALCULATED RESULTS
  // =================================================================

  /** A list of completions that have been successfully resolved against a syllabus. */
  allCompletions: CompletedItemRecord[];

  /** The person's current "working" PQS level, calculated by the application. */
  derivedPqsWorkingLevel?: number;

  /** The person's current "working" events level, calculated by the application. */
  derivedEventsWorkingLevel?: number;

  // --- NEW: Progress Metrics ---
  /** The completion percentage for PQS items at the current derived working level. */
  pqsProgressPercentage?: number;

  /** The completion percentage for Event items at the current derived working level. */
  eventsProgressPercentage?: number;
}
