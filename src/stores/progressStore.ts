import { defineStore } from "pinia";
import { usePersonnelStore } from "./personnelStore";
import { useUiStore } from "./uiStore";
import { useSyllabiStore } from "./syllabiStore";
import { createPersonnelNameMatcher } from "../utils/nameMatcher";
import {
  processSharpTrainingFile,
  type ProcessedSharpDataMap,
} from "../core/excelProcessorServices/trainingDataProcessorService";
import { useAppConfigStore } from "./appConfigStore";
import { loggingService } from "@/utils/loggingService";
import { type RawCompletion } from "@/types/progressTypes";

const SVC_MODULE = "[ProgressStore]";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    pendingSharpData: null as ProcessedSharpDataMap | null,
    detectedTrack: null as string | null,
    lastMergedUpgraderIds: [] as string[],
  }),
  actions: {
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
    confirmAndMergeSharpData() {
      // This function remains as-is for the single-file workflow
    },
    // This is the multi-file action that needs to be fixed
    async processAndMergeMultipleFiles(files: File[]) {
      const personnelStore = usePersonnelStore();
      const uiStore = useUiStore();
      let totalCompletions = 0;
      const updatedIds = new Set<string>();

      loggingService.logInfo(
        `${SVC_MODULE} Starting batch processing of ${files.length} files.`
      );

      for (const file of files) {
        try {
          const { data } = await processSharpTrainingFile(file);
          if (data.size > 0) {
            data.forEach((studentData, studentName) => {
              const person = personnelStore.getUpgraderByName(studentName);
              if (person) {
                updatedIds.add(person.id); // Add the person's ID to our set of updated people
                const rawCompletions: RawCompletion[] =
                  studentData.completions.map((c) => ({
                    requirementId: c.event,
                    completionDate: c.date,
                    grade: c.grade,
                  }));
                personnelStore.addCompletionsToUpgrader(
                  person.id,
                  rawCompletions
                );
                totalCompletions += rawCompletions.length;
              }
            });
          }
        } catch (error: any) {
          loggingService.logError(
            `${SVC_MODULE} Failed to process file ${file.name} in batch.`,
            error
          );
          uiStore.addNotification({
            message: `Failed to process ${file.name}: ${error.message}`,
            type: "error",
          });
        }
      }

      // --- THIS IS THE FIX ---
      // After processing all files, update the store's state with the list of people who were updated.
      this.lastMergedUpgraderIds = Array.from(updatedIds);
      // --- END OF FIX ---

      loggingService.logInfo(
        `${SVC_MODULE} Batch processing complete. Merged ${totalCompletions} records for ${updatedIds.size} personnel.`
      );

      return {
        completionsFound: totalCompletions,
        personnelUpdated: updatedIds.size,
      };
    },
    cancelSharpDataMerge() {
      this.pendingSharpData = null;
      this.detectedTrack = null;
    },
  },
});
