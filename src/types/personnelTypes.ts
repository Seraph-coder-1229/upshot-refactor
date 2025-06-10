import { type Identifiable, type Named } from "./commonTypes";
import {
  type CompletedItemRecord,
  type PrioritizedRequirement,
} from "./syllabiTypes";
import { type DetailedCompletionRecord } from "../core/excelProcessorServices/trainingDataProcessorService";

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
  id: string; // Composite ID: SHARP Name + '-' + Position
  name: string; // SHARP Name
  displayName: string;
  rank?: string;
  startDate: Date;

  // USER-MANAGED GOALS
  assignedPosition: string;
  assignedSyllabusYear: string;
  targetQualificationLevel: number;
  onWaiver?: boolean;
  manuallyUnlockedLevels?: number[]; // For L400+ progression

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
