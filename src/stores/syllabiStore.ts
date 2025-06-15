// src/stores/syllabiStore.ts

import { defineStore } from "pinia";
import { type Syllabus, type Requirement } from "../types/syllabiTypes";
import { DEFAULT_SYLLABI } from "../config/syllabiDefaults";
import { loggingService } from "../utils/loggingService";
import { saveAs } from "file-saver";
import { deepClone } from "@/utils/dataUtils";
import { excelSyllabusProcessorService } from "../core/excelProcessorServices/syllabusProcessorService";
import { useUiStore } from "./uiStore";

export function getInitialSyllabi(): Syllabus[] {
  // Check if the correct variable exists and is an array.
  if (
    typeof window.UPSHOT_USER_SYLLABI !== "undefined" &&
    Array.isArray(window.UPSHOT_USER_SYLLABI)
  ) {
    // Log the success message you were seeing in the console.
    loggingService.logInfo(
      "User syllabi loaded successfully from window.UPSHOT_USER_SYLLABI."
    );
    try {
      // Perform a deep copy to prevent bugs with Vue's reactivity system.
      return JSON.parse(JSON.stringify(window.UPSHOT_USER_SYLLABI));
    } catch (e) {
      loggingService.logError(
        "Error parsing user syllabi data from window.UPSHOT_USER_SYLLABI.",
        e
      );
      return []; // Return empty array on parsing error
    }
  }

  // This will run if the `UPSHOT_USER_SYLLABI` variable isn't found.
  loggingService.logWarn(
    "window.UPSHOT_USER_SYLLABI not found. No user syllabi loaded."
  );
  return [];
}

export const useSyllabiStore = defineStore("syllabi", {
  state: () => ({
    allSyllabi: getInitialSyllabi(),
    isLoading: false,
    isDirty: false,
    lastLoadedSyllabiSnapshot: JSON.stringify(getInitialSyllabi()),
    pendingSyllabusForConfirmation: null as Syllabus | null, // ADD THIS LINE
  }),
  getters: {
    getSyllabusById:
      (state) =>
      (id: string): Syllabus | undefined => {
        return state.allSyllabi.find((s) => s.id === id);
      },
    findSyllabus:
      (state) =>
      (position: string, year: string): Syllabus | undefined => {
        return state.allSyllabi.find(
          (s) =>
            s.position.toUpperCase().trim() === position.toUpperCase().trim() &&
            s.year.trim() === year.trim()
        );
      },
    getRequirementsForSyllabus:
      (state) =>
      (position: string, year: string, level?: string): Requirement[] => {
        const syllabus = state.allSyllabi.find(
          (s) =>
            s.position.toUpperCase().trim() === position.toUpperCase().trim() &&
            s.year.trim() === year.trim()
        );
        if (!syllabus) return [];
        return level === undefined
          ? syllabus.requirements
          : syllabus.requirements.filter(
              (req) => String(req.level).trim() === level.trim()
            );
      },
    getAvailablePositions: (state): string[] => {
      const positions = new Set(state.allSyllabi.map((s) => s.position.trim()));
      return Array.from(positions).sort();
    },
    getAvailableYearsForPosition:
      (state) =>
      (position: string): string[] => {
        const years = new Set(
          state.allSyllabi
            .filter(
              (s) =>
                s.position.toUpperCase().trim() ===
                position.toUpperCase().trim()
            )
            .map((s) => s.year.trim())
        );
        return Array.from(years).sort((a, b) => b.localeCompare(a));
      },
    getAvailableLevels:
      (state) =>
      (position: string, year: string): string[] => {
        const levels = new Set<string>();
        const syllabus = state.allSyllabi.find(
          (s) =>
            s.position.toUpperCase().trim() === position.toUpperCase().trim() &&
            s.year.trim() === year.trim()
        );
        if (syllabus) {
          syllabus.requirements.forEach((req) =>
            levels.add(String(req.level).trim())
          );
        }
        return Array.from(levels).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
      },
  },
  actions: {
    setPendingSyllabus(syllabus: Syllabus | null) {
      this.pendingSyllabusForConfirmation = syllabus;
    },
    acceptPendingSyllabus() {
      if (this.pendingSyllabusForConfirmation) {
        this.addSyllabus(this.pendingSyllabusForConfirmation);
        this.pendingSyllabusForConfirmation = null;
      }
    },
    markAsDirty() {
      this.isDirty = true;
    },
    markAsSaved() {
      this.isDirty = false;
      this.lastLoadedSyllabiSnapshot = JSON.stringify(this.allSyllabi);
    },
    addSyllabus(syllabus: Syllabus) {
      this.allSyllabi.push(syllabus);
      this.markAsDirty();
    },
    updateSyllabus(id: string, updatedSyllabus: Syllabus) {
      const index = this.allSyllabi.findIndex((s) => s.id === id);
      if (index !== -1) {
        this.allSyllabi[index] = updatedSyllabus;
        this.markAsDirty();
      }
    },
    removeSyllabus(id: string) {
      this.allSyllabi = this.allSyllabi.filter((s) => s.id !== id);
      this.markAsDirty();
    },
    async importSyllabiFromSharpExport(file: File) {
      const uiStore = useUiStore();
      uiStore.addNotification({
        message: `Importing syllabus from "${file.name}"...`,
        type: "info",
        duration: 3000,
      });
      uiStore.setGlobalLoading(true);
      loggingService.logInfo(
        `Attempting to import syllabi from SHARP export: ${file.name}`
      );
      try {
        const parsedSyllabi = await excelSyllabusProcessorService(file);
        if (parsedSyllabi.length > 0) {
          this.setSyllabi(parsedSyllabi);
          loggingService.logInfo(
            `${parsedSyllabi.length} syllabi successfully parsed and loaded from SHARP file: ${file.name}`
          );
          uiStore.addNotification({
            message: `${parsedSyllabi.length} syllabi imported successfully from "${file.name}". Please review and download to persist.`,
            type: "success",
            duration: 7000,
          });
        } else {
          throw new Error("Syllabus processor returned no syllabi.");
        }
      } catch (error) {
        loggingService.logError(
          `Failed to import and process SHARP syllabus file: ${file.name}`,
          error
        );
        uiStore.addNotification({
          message: "Failed to import syllabus file. See console for details.",
          type: "error",
        });
      } finally {
        uiStore.setGlobalLoading(false);
      }
    },
    downloadSyllabi() {
      const fileContent =
        "// UPSHOT User Syllabi File\nwindow.UPSHOT_USER_SYLLABI = " +
        JSON.stringify(this.allSyllabi, null, 2) +
        ";";
      const blob = new Blob([fileContent], {
        type: "text/javascript;charset=utf-8",
      });
      saveAs(blob, "user_syllabi.js");
      this.markAsSaved();
    },
    setSyllabi(syllabi: Syllabus[]) {
      this.allSyllabi = syllabi;
      this.markAsSaved();
    },
  },
});
