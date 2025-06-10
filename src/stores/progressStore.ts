import { defineStore } from "pinia";
import { usePersonnelStore } from "./personnelStore";
import { useUiStore } from "./uiStore";
import { useSyllabiStore } from "./syllabiStore";
import { createPersonnelNameMatcher } from "../utils/nameMatcher";
import {
  processSharpTrainingFile,
  type ProcessedSharpDataMap,
} from "../core/excelProcessorServices/trainingDataProcessorService";
import {
  calculateDerivedWorkingLevels,
  calculateProgressMetrics,
  calculatePacing,
  calculateProjections,
  calculateReadiness,
  getPrioritizedRequirements,
} from "../core/trainingLogicService";
import { useAppConfigStore } from "./appConfigStore";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    lastProcessingStats: { matched: 0, unmatched: 0 },
    pendingSharpData: null as ProcessedSharpDataMap | null,
    detectedTrack: null as string | null,
    lastMergedUpgraderIds: [] as string[],
  }),
  actions: {
    /**
     * Step 1: Processes a SHARP file and stages it for user confirmation.
     */
    async loadAndProcessSharpFile(sharpFile: File) {
      const uiStore = useUiStore();
      this.pendingSharpData = null;
      this.detectedTrack = null;

      if (
        !usePersonnelStore().isDataLoaded ||
        useSyllabiStore().allSyllabi.length === 0
      ) {
        uiStore.addNotification({
          message: "Please load Personnel and Syllabi data first.",
          type: "warning",
          duration: 5000,
        });
        return;
      }

      uiStore.setGlobalLoading(true);
      try {
        const { detectedTrack, data } = await processSharpTrainingFile(
          sharpFile
        );
        if (data.size > 0) {
          this.pendingSharpData = data;
          this.detectedTrack = detectedTrack;
          uiStore.addNotification({
            message: `File processed. Detected track: ${
              detectedTrack || "Unknown"
            }. Please confirm to merge.`,
            type: "info",
            duration: 3000,
          });
        } else {
          uiStore.addNotification({
            message: "SHARP file processed, but no data was found.",
            type: "warning",
            duration: 0,
          });
        }
      } catch (error) {
        console.error("Error processing SHARP file:", error);
        uiStore.addNotification({
          message: "An error occurred during SHARP file processing.",
          type: "error",
        });
      } finally {
        uiStore.setGlobalLoading(false);
      }
    },

    /**
     * Step 2: Merges the staged SHARP data after user confirmation.
     */
    confirmAndMergeSharpData() {
      if (!this.pendingSharpData) {
        console.error("No pending SHARP data to merge.");
        return;
      }

      const personnelStore = usePersonnelStore();
      const syllabiStore = useSyllabiStore();
      const uiStore = useUiStore();
      const appConfigStore = useAppConfigStore();
      const nameMatcher = createPersonnelNameMatcher(
        personnelStore.allPersonnel
      );

      const matchedPersonnelIds = new Set<string>();
      const unmatchedNames = new Set<string>();

      // Merge data from the staged 'pendingSharpData'
      for (const [name, studentData] of this.pendingSharpData.entries()) {
        const personnelId = nameMatcher.findMatch(name, this.detectedTrack);
        if (personnelId) {
          matchedPersonnelIds.add(personnelId);
          const upgrader = personnelStore.getPersonnelById(personnelId);
          if (upgrader) {
            // --- THIS IS THE COMPLETED MERGE LOGIC ---
            // 1. Update PQS version and status
            upgrader.currentSharpPqsVersion = studentData.pqsVersionName;
            upgrader.pqsVersionStatus = studentData.pqsVersionStatus;

            // 2. Update ACTC Level statuses
            if (!upgrader.actcLevelData) upgrader.actcLevelData = {};
            for (const [
              level,
              status,
            ] of studentData.actcLevelStatuses.entries()) {
              if (!upgrader.actcLevelData[level])
                upgrader.actcLevelData[level] = {};
              upgrader.actcLevelData[level].status = status;
            }

            // 3. Append all new raw completion records
            // A more advanced implementation could check for duplicates before pushing
            upgrader.rawCompletions.push(...studentData.completions);
          }
        } else {
          unmatchedNames.add(name);
        }
      }

      this.lastMergedUpgraderIds = Array.from(matchedPersonnelIds);

      // Recalculate all metrics for matched personnel
      for (const id of matchedPersonnelIds) {
        const upgrader = personnelStore.getPersonnelById(id);
        const syllabus = upgrader
          ? syllabiStore.findSyllabus(
              upgrader.assignedPosition,
              upgrader.assignedSyllabusYear
            )
          : undefined;
        if (upgrader && syllabus) {
          calculateDerivedWorkingLevels(
            upgrader,
            syllabus,
            appConfigStore.currentConfig
          );
          calculateProgressMetrics(upgrader, syllabus);
          calculatePacing(upgrader, syllabus, appConfigStore.currentConfig);
          calculateProjections(
            upgrader,
            syllabus,
            appConfigStore.currentConfig
          );
          calculateReadiness(upgrader, syllabus);
        }
      }

      // Report and clean up
      uiStore.addNotification({
        message: `Successfully merged data for ${matchedPersonnelIds.size} personnel.`,
        type: "success",
        duration: 2000,
      });
      this.pendingSharpData = null;
      this.detectedTrack = null;
    },

    /**
     * Cancels the pending merge operation.
     */
    cancelSharpDataMerge() {
      if (this.pendingSharpData) {
        useUiStore().addNotification({
          message: "SHARP data merge has been cancelled.",
          type: "info",
          duration: 3000,
        });
      }
      this.pendingSharpData = null;
      this.detectedTrack = null;
      this.lastMergedUpgraderIds = [];
    },
  },
});
