import { defineStore } from "pinia";
import { type Upgrader } from "../types/personnelTypes";
import { type RawCompletion } from "../types/progressTypes";
import { useUiStore } from "./uiStore";
import { type DetailedCompletionRecord } from "../types/personnelTypes";
import { processPersonnelFile } from "../core/excelProcessorServices/personnelProcessorService";
import { useSyllabiStore } from "./syllabiStore";
import { useAppConfigStore } from "./appConfigStore";
import {
  calculateDerivedWorkingLevels,
  calculateItemsToMeetMilestones,
  calculatePacing,
  calculateProgressMetrics,
  calculateProjections,
  calculateReadiness,
} from "@/core/trainingLogicService";

export const usePersonnelStore = defineStore("personnel", {
  state: () => ({
    allPersonnel: [] as Upgrader[],
    personnelMap: new Map<string, Upgrader>(),
    isDirty: false,
    isDataLoaded: false,
  }),

  getters: {
    getPersonnelById:
      (state) =>
      (id: string): Upgrader | undefined => {
        const trimmedId = id ? id.trim() : "";
        return state.allPersonnel.find((p) => p.id.trim() === trimmedId);
      },
    /**
     * New Fuzzy-matching getter to find personnel even with inconsistent IDs.
     */
    getPersonnelByFuzzyId:
      (state) =>
      (id: string): Upgrader | undefined => {
        if (!id) return undefined;
        const trimmedId = id.trim();
        const lowerCaseId = trimmedId.toLowerCase();

        // 1. Try a direct, case-insensitive match on the correct ID.
        const directMatch = state.allPersonnel.find(
          (p) => p.id.trim().toLowerCase() === lowerCaseId
        );
        if (directMatch) return directMatch;

        // 2. Fallback: Check for composite keys that might be used in URLs.
        const fallbackMatch = state.allPersonnel.find((p) => {
          // e.g., "AWO2 Birch-AAW"
          const compositeKey = `${p.rank} ${p.name}-${p.assignedPosition}`;
          return compositeKey.toLowerCase() === lowerCaseId;
        });

        return fallbackMatch;
      },
    getUpgraderByName:
      (state) =>
      (name: string): Upgrader | undefined => {
        if (!name) return undefined;
        const normalizedName = name.trim().toUpperCase();
        return state.allPersonnel.find(
          (p) => p.name.trim().toUpperCase() === normalizedName
        );
      },
    allPersonnelSortedByName: (state): Upgrader[] => {
      return [...state.allPersonnel].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    },
  },

  actions: {
    async loadPersonnelFromFile(file: File) {
      const uiStore = useUiStore();
      uiStore.setGlobalLoading(true);
      try {
        const personnelList = await processPersonnelFile(file);
        this.setPersonnel(personnelList);
        if (personnelList.length > 0) {
          uiStore.addNotification({
            message: `Successfully loaded ${personnelList.length} personnel records.`,
            type: "success",
          });
        } else {
          uiStore.addNotification({
            message: "Processed file, but no personnel records were found.",
            type: "warning",
          });
        }
      } catch (error) {
        console.error("Failed to process personnel file:", error);
        uiStore.addNotification({
          message: "An error occurred while processing the personnel file.",
          type: "error",
        });
      } finally {
        uiStore.setGlobalLoading(false);
      }
    },
    setPersonnel(personnelList: Upgrader[]) {
      this.allPersonnel = personnelList;
      this.personnelMap = new Map(personnelList.map((p) => [p.id, p]));
      this.isDataLoaded = personnelList.length > 0;
    },
    updatePersonnel(updatedUpgrader: Upgrader) {
      const index = this.allPersonnel.findIndex(
        (p) => p.id === updatedUpgrader.id
      );
      if (index !== -1) {
        // Recalculate all metrics upon update to ensure data consistency
        const syllabiStore = useSyllabiStore();
        const appConfigStore = useAppConfigStore();
        const syllabus = syllabiStore.findSyllabus(
          updatedUpgrader.assignedPosition,
          updatedUpgrader.assignedSyllabusYear
        );
        if (syllabus) {
          calculateProgressMetrics(updatedUpgrader, syllabus);
          calculateDerivedWorkingLevels(
            updatedUpgrader,
            syllabus,
            appConfigStore.currentConfig
          );
          calculatePacing(
            updatedUpgrader,
            syllabus,
            appConfigStore.currentConfig
          );
          calculateProjections(
            updatedUpgrader,
            syllabus,
            appConfigStore.currentConfig
          );
          calculateReadiness(updatedUpgrader, syllabus);
          calculateItemsToMeetMilestones(
            updatedUpgrader,
            syllabus,
            appConfigStore.currentConfig
          );
        }
        this.allPersonnel[index] = updatedUpgrader;
      }
    },

    addCompletionsToUpgrader(
      upgraderId: string,
      newCompletions: RawCompletion[]
    ) {
      const upgrader = this.getPersonnelById(upgraderId);
      if (!upgrader) {
        console.error(
          `Could not find upgrader with ID ${upgraderId} to add completions.`
        );
        return;
      }

      const updatedUpgrader = JSON.parse(JSON.stringify(upgrader));

      // Restore Date objects that were turned into strings by the deep copy
      updatedUpgrader.startDate = new Date(updatedUpgrader.startDate);
      if (Array.isArray(updatedUpgrader.rawCompletions)) {
        updatedUpgrader.rawCompletions.forEach(
          (comp: DetailedCompletionRecord) => {
            comp.date = new Date(comp.date);
          }
        );
      }
      if (Array.isArray(updatedUpgrader.allCompletions)) {
        updatedUpgrader.allCompletions.forEach((comp: any) => {
          comp.completionDate = new Date(comp.completionDate);
        });
      }

      const mappedCompletions: DetailedCompletionRecord[] = newCompletions.map(
        (c) => ({
          event: c.requirementId,
          date: c.completionDate,
          grade: c.grade ?? undefined,
        })
      );

      updatedUpgrader.rawCompletions.push(...mappedCompletions);

      const syllabiStore = useSyllabiStore();
      const appConfigStore = useAppConfigStore();
      const syllabus = syllabiStore.findSyllabus(
        updatedUpgrader.assignedPosition,
        updatedUpgrader.assignedSyllabusYear
      );

      if (syllabus) {
        // These functions mutate the 'updatedUpgrader' object, adding all calculated fields.
        calculateProgressMetrics(updatedUpgrader, syllabus);
        calculateDerivedWorkingLevels(
          updatedUpgrader,
          syllabus,
          appConfigStore.currentConfig
        );
        calculatePacing(
          updatedUpgrader,
          syllabus,
          appConfigStore.currentConfig
        );
        calculateProjections(
          updatedUpgrader,
          syllabus,
          appConfigStore.currentConfig
        );
        calculateReadiness(updatedUpgrader, syllabus);
        calculateItemsToMeetMilestones(
          updatedUpgrader,
          syllabus,
          appConfigStore.currentConfig
        );

        // Replace the old object in the store with the fully updated one to ensure reactivity.
        this.updatePersonnel(updatedUpgrader);
      }
    },
  },
});
