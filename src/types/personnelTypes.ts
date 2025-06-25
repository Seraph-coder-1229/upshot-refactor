import { type Identifiable, type Named } from "./commonTypes";
import {
  type CompletedItemRecord,
  type PrioritizedRequirement,
} from "./syllabiTypes";

// This interface is now correctly located here.
export interface DetailedCompletionRecord {
  event: string;
  date: Date;
  instructor?: string;
  grade?: number | string;
  status?: string;
}

export enum ReadinessStatus {
  ReadyForNextLevel = "Ready for Next Level",
  OnTrack = "On Track",
  AtRisk = "At Risk",
  BehindSchedule = "Behind Schedule",
  Blocked = "Blocked",
  Unknown = "Unknown",
}

export interface Upgrader extends Identifiable, Named {
  // CORE IDENTITY
  id: string;
  name: string;
  displayName: string;
  rank?: string;
  startDate: Date;
  levelSyllabusYears: Record<number, string>;

  // USER-MANAGED GOALS
  assignedPosition: string;
  assignedSyllabusYear: string;
  targetQualificationLevel: number;
  onWaiver?: boolean;
  manuallyUnlockedLevels?: number[];

  // SHARP-DERIVED DATA
  currentSharpPqsVersion?: string | null;
  pqsVersionStatus?: string | null;
  actcLevelData?: { [level: string]: { status?: string | null } };
  rawCompletions: DetailedCompletionRecord[];

  // APPLICATION-CALCULATED RESULTS
  allCompletions: CompletedItemRecord[];
  derivedPqsWorkingLevel?: string;
  derivedEventsWorkingLevel?: string;
  pqsProgressPercentage?: number;
  eventsProgressPercentage?: number;
  pacingAgainstTargetDays?: number;
  pacingAgainstDeadlineDays?: number;
  projectedPqsCompletionDate?: Date;
  projectedEventsCompletionDate?: Date;
  projectedTotalCompletionDate?: Date;
  readinessAgainstTarget?: ReadinessStatus;
  readinessAgainstDeadline?: ReadinessStatus;
  finalDeadline?: Date; // The calculated final deadline date
  idealCompletionDate?: Date; // The calculated ideal completion date
  pacingAgainstIdealDays?: number; // Pacing against the ideal completion date
  costFactor?: number; // Overall cost factor (0-100)
  eventsToMeetDeadline?: number; // Events needed to be on time for deadline
  pqsToMeetDeadline?: number; // PQS items needed to be on time for deadline
  eventsToMeetIdeal?: number; // Events needed to be on time for ideal target
  pqsToMeetIdeal?: number;
}

/**
 * @interface PersonnelWithNoSyllabus
 * Represents a person who was present in an imported report but for whom no
 * corresponding active syllabus could be found in the application.
 */
export interface PersonnelWithNoSyllabus {
  /**
   * The full name of the person as it appeared in the source file.
   * @type {string}
   */
  name: string;

  /**
   * The name of the track or PQS from the source file that could not be matched.
   * @type {string}
   */
  unmatchedTrackName: string;
}
