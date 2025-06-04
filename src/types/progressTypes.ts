import {
  type CompletedItemRecord,
  type Requirement,
  type Syllabus,
} from "./syllabiTypes";
import { type SharpSheetRow } from "./excelTypes"; // Assuming you'll define SharpSheetRow in an excelTypes.ts

/**
 * Represents the processed progress of an Upgrader against a specific Syllabus.
 */
export interface UpgraderSyllabusProgress {
  syllabusId: string; // From Syllabus.id
  totalRequirements: number;

  itemsCompleted: CompletedItemRecord[]; // All items considered 'met' (actual completion or waiver)
  itemsRemainingIds: string[]; // IDs/names of Requirements not yet met

  // Detailed breakdown of remaining items with their readiness status
  itemsRemainingWithDetails: Array<{
    requirement: Requirement;
    isReady: boolean; // Are prerequisites met?
    missingPrerequisites: string[];
  }>;

  completionPercentage: number; // (itemsCompleted.length / totalRequirements) * 100
  isSyllabusComplete: boolean;

  // Optional: Projected dates, ahead/behind status for this specific syllabus
  projectedCompletionDate?: Date | null;
  monthsAheadOrBehind?: number; // Positive if ahead, negative if behind schedule for this syllabus
}

/**
 * State structure for the progressStore.
 * - rawSharpDataByPosition: Stores the most recently loaded raw parsed data from SHARP files, keyed by position.
 * - upgraderProgress: Stores the calculated progress for each upgrader against each relevant syllabus.
 */
export interface ProgressStoreState {
  // Key: Position (e.g., "EWO", "PILOT"). Value: Array of raw rows parsed from that position's SHARP file.
  // This raw data is kept to allow re-processing if syllabi or personnel details change.
  rawSharpDataByPosition: Map<string, SharpSheetRow[]>;

  // Key: Upgrader.id
  // Value: Map where Key is Syllabus.id, Value is their progress against that syllabus
  upgraderSyllabusCompletion: Map<
    string,
    Map<string, UpgraderSyllabusProgress>
  >;

  // Could also store overall calculated metrics per upgrader if not directly on Upgrader object
  // upgraderOverallMetrics: Map<string, {
  //   currentTrainingMonth: number;
  //   overallPriorityScore: number;
  // }>;

  isLoading: boolean; // For when SHARP files are being processed
}
