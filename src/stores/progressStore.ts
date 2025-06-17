// src/stores/progressStore.ts
import { defineStore } from "pinia";
import { usePersonnelStore } from "./personnelStore";
import { useSyllabiStore } from "./syllabiStore";
import { useAppConfigStore } from "./appConfigStore";
import { useUiStore } from "./uiStore";
import { createPersonnelNameMatcher } from "../utils/nameMatcher";
import { processSharpTrainingFile } from "../core/excelProcessorServices/trainingDataProcessorService";
import { runFullUpgraderCalculation } from "../core/trainingLogicService";
import { loggingService } from "@/utils/loggingService";
import { Upgrader } from "@/types/personnelTypes";

const SVC_MODULE = "[ProgressStore]";

export const useProgressStore = defineStore("progress", {
  state: () => ({
    lastMergedUpgraderIds: [] as string[],
  }),

  actions: {
    /**
     * Helper function to run all calculations for a single upgrader.
     * This is the missing piece of the puzzle.
     */
    _recalculateUpgraderMetrics(upgrader: Upgrader) {
      const syllabiStore = useSyllabiStore();
      const appConfigStore = useAppConfigStore();
      const syllabus = syllabiStore.findSyllabus(
        upgrader.assignedPosition,
        upgrader.assignedSyllabusYear
      );

      if (!syllabus) {
        loggingService.logWarn(
          `[Metrics] No matching syllabus found for ${upgrader.displayName}. Skipping calculations.`
        );
        return;
      }

      // Run all the necessary calculations from the logic service.
      runFullUpgraderCalculation(upgrader, syllabus, appConfigStore.config);
    },

    /**
     * Processes a SHARP file, updates personnel records, recalculates all metrics,
     * and stores the IDs of affected users.
     */
    async processAndApplySharpReport(file: File) {
      const personnelStore = usePersonnelStore();
      const uiStore = useUiStore();
      this.lastMergedUpgraderIds = [];

      if (personnelStore.allPersonnel.length === 0) {
        const message =
          "Cannot process SHARP data until a personnel roster is loaded.";
        loggingService.logWarn(`${SVC_MODULE} ${message}`);
        return { success: false, updatedCount: 0, message };
      }

      uiStore.setGlobalLoading(true);
      try {
        const processedFile = await processSharpTrainingFile(file);
        const { data: processedData, detectedTrack } = processedFile;

        if (!processedData || processedData.size === 0) {
          const message =
            "No valid training records were found in the SHARP file.";
          loggingService.logWarn(`${SVC_MODULE} ${message}`);
          return { success: false, updatedCount: 0, message };
        }

        const nameMatcher = createPersonnelNameMatcher(
          personnelStore.allPersonnel
        );
        const updatedIds = new Set<string>();
        let recordsMerged = 0;

        processedData.forEach((studentData, nameFromSharpFile) => {
          const matchedPersonnelId = nameMatcher.findMatch(
            nameFromSharpFile,
            detectedTrack
          );
          if (matchedPersonnelId) {
            const upgrader =
              personnelStore.getPersonnelById(matchedPersonnelId);
            if (upgrader) {
              upgrader.rawCompletions.push(...studentData.completions);
              recordsMerged += studentData.completions.length;
              updatedIds.add(upgrader.id);
            }
          }
        });

        // CRITICAL STEP: Recalculate metrics for every person who was updated.
        for (const id of updatedIds) {
          const upgrader = personnelStore.getPersonnelById(id);
          if (upgrader) {
            this._recalculateUpgraderMetrics(upgrader);
          }
        }

        this.lastMergedUpgraderIds = Array.from(updatedIds);
        const message = `${recordsMerged} training records applied to ${updatedIds.size} personnel. All progress metrics have been updated.`;
        loggingService.logInfo(`${SVC_MODULE} ${message}`);
        return { success: true, updatedCount: updatedIds.size, message };
      } catch (error: any) {
        loggingService.logError(
          `${SVC_MODULE} Failed to process and apply SHARP report.`,
          error
        );
        return { success: false, updatedCount: 0, message: error.message };
      } finally {
        uiStore.setGlobalLoading(false);
      }
    },
  },
});
