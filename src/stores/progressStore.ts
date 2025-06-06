import { defineStore } from "pinia";
import { usePersonnelStore } from "./personnelStore";
import { useUiStore } from "./uiStore";
import { useSyllabiStore } from "./syllabiStore";
import { createPersonnelNameMatcher } from "../utils/nameMatcher";
import {
  processSharpTrainingFile,
  type ProcessedSharpDataMap,
} from "../core/excelProcessorServices/trainingDataProcessorService";
import { calculateDerivedWorkingLevels } from "../core/trainingLogicService";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    lastProcessingStats: { matched: 0, unmatched: 0 },
    // --- NEW: Staging area for pending data ---
    pendingSharpData: null as ProcessedSharpDataMap | null,
    detectedTrack: null as string | null,
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
          // In a real UI, this would trigger a confirmation modal via the uiStore
          console.log(
            `File processed. Detected track: ${detectedTrack}. Awaiting confirmation.`
          );
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

      // Merge data from the staged 'pendingSharpData'
      for (const [name, studentData] of this.pendingSharpData.entries()) {
        const personnelId = nameMatcher.findMatch(name);
        if (personnelId) {
          matchedPersonnelIds.add(personnelId);
          const upgrader = personnelStore.getPersonnelById(personnelId);
          if (upgrader) {
            // ... (The merge logic is the same as before) ...
            upgrader.currentSharpPqsVersion = studentData.pqsVersionName;
            // ... etc ...
          }
        } else {
          unmatchedNames.add(name);
        }
      }

      // Recalculate derived levels
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
        }
      }

      // Report and clean up
      uiStore.addNotification({
        message: `Successfully merged data for ${matchedPersonnelIds.size} personnel.`,
        type: "success",
      });
      this.pendingSharpData = null;
      this.detectedTrack = null;
    },

    /**
     * Cancels the pending merge operation.
     */
    cancelSharpDataMerge() {
      this.pendingSharpData = null;
      this.detectedTrack = null;
    },
  },
});
