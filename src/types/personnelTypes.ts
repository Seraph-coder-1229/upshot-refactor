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
}
