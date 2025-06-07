import { defineStore } from "pinia";
import { usePersonnelStore } from "./personnelStore";
import { useUiStore } from "./uiStore";
import { useSyllabiStore } from "./syllabiStore";
import { createPersonnelNameMatcher } from "../utils/nameMatcher";
// Note: Adjusted the import path to match the project structure we defined.
import {
  processSharpTrainingFile,
  type ProcessedSharpDataMap,
} from "../core/excelProcessorServices/trainingDataProcessorService";
import {
  calculateDerivedWorkingLevels,
  calculateProgressMetrics,
} from "../core/trainingLogicService";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    lastProcessingStats: { matched: 0, unmatched: 0 },
    // Staging area for data awaiting user confirmation
    pendingSharpData: null as ProcessedSharpDataMap | null,
    detectedTrack: null as string | null,
  }),
  actions: {
    /**
     * Step 1: Processes a SHARP file and stages it for user confirmation.
     * This action does NOT merge the data, it only prepares it.
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
          // This console log is a placeholder for a UI modal that will ask the user to confirm.
          console.log(
            `File processed. Detected track: ${detectedTrack}. Awaiting confirmation.`
          );
          uiStore.addNotification({
            message: `File processed. Detected track: ${
              detectedTrack || "Unknown"
            }. Please confirm to merge.`,
            type: "info",
            duration: 10000,
          });
        } else {
          uiStore.addNotification({
            message: "SHARP file processed, but no data was found.",
            type: "warning",
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
      const nameMatcher = createPersonnelNameMatcher(
        personnelStore.allPersonnel
      );

      const matchedPersonnelIds = new Set<string>();
      const unmatchedNames = new Set<string>();

      for (const [name, studentData] of this.pendingSharpData.entries()) {
        const personnelId = nameMatcher.findMatch(name);
        if (personnelId) {
          matchedPersonnelIds.add(personnelId);
          const upgrader = personnelStore.getPersonnelById(personnelId);
          if (upgrader) {
            upgrader.currentSharpPqsVersion = studentData.pqsVersionName;
            upgrader.pqsVersionStatus = studentData.pqsVersionStatus;
            if (!upgrader.actcLevelData) upgrader.actcLevelData = {};
            for (const [
              level,
              status,
            ] of studentData.actcLevelStatuses.entries()) {
              if (!upgrader.actcLevelData[level])
                upgrader.actcLevelData[level] = {};
              upgrader.actcLevelData[level].status = status;
            }
            upgrader.rawCompletions.push(...studentData.completions);
          }
        } else {
          unmatchedNames.add(name);
        }
      }

      // Recalculate levels and metrics for all matched personnel
      for (const id of matchedPersonnelIds) {
        const upgrader = personnelStore.getPersonnelById(id);
        const syllabus = upgrader
          ? syllabiStore.findSyllabus(
              upgrader.assignedPosition,
              upgrader.assignedSyllabusYear
            )
          : undefined;
        if (upgrader && syllabus) {
          calculateDerivedWorkingLevels(upgrader, syllabus);
          calculateProgressMetrics(upgrader, syllabus);
        }
      }

      // Report and clean up the staged data
      uiStore.addNotification({
        message: `Successfully merged data for ${matchedPersonnelIds.size} personnel.`,
        type: "success",
      });
      this.pendingSharpData = null;
      this.detectedTrack = null;
    },

    /**
     * Cancels the pending merge operation and clears the staged data.
     */
    cancelSharpDataMerge() {
      if (this.pendingSharpData) {
        useUiStore().addNotification({
          message: "SHARP data merge has been cancelled.",
          type: "info",
        });
      }
      this.pendingSharpData = null;
      this.detectedTrack = null;
    },
  },
});
