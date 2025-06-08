// src/stores/syllabiStore.ts
import { defineStore } from "pinia";
import { type Syllabus, Requirement } from "../types/syllabiTypes";
import { DEFAULT_SYLLABI } from "../config/syllabiDefaults";
import { loggingService } from "../utils/loggingService";
// import { saveAs } from "file-saver"; // For downloading
// import { APP_VERSION } from "../config/constants"; // Assuming APP_VERSION is in constants.ts
import { deepClone } from "@/utils/dataUtils";
import { excelSyllabusProcessorService } from "../core/excelProcessorServices/syllabusProcessorService";
import { useUiStore } from "./uiStore"; // For notifications and loading state
import { saveAs } from "file-saver";
// Function to get the initial syllabi
function getInitialSyllabi(): Syllabus[] {
  let loadedSyllabi = deepClone(DEFAULT_SYLLABI); // Start with built-in defaults

  if (
    Array.isArray(window.UPSHOT_USER_SYLLABI) &&
    window.UPSHOT_USER_SYLLABI.length > 0
  ) {
    try {
      // Basic validation: check if the first item looks like a syllabus
      // More robust validation would check each item's structure.
      if (
        window.UPSHOT_USER_SYLLABI[0] &&
        typeof window.UPSHOT_USER_SYLLABI[0].id === "string" &&
        Array.isArray(window.UPSHOT_USER_SYLLABI[0].requirements)
      ) {
        loadedSyllabi = deepClone(window.UPSHOT_USER_SYLLABI);
        loggingService.logInfo(
          `User syllabi loaded from window.UPSHOT_USER_SYLLABI (${loadedSyllabi.length} syllabi).`
        );
      } else {
        loggingService.logWarn(
          "User syllabi from window.UPSHOT_USER_SYLLABI appears malformed. Using default syllabi."
        );
        loadedSyllabi = deepClone(DEFAULT_SYLLABI);
      }
    } catch (e: any) {
      loggingService.logError(
        "Error processing user_syllabi from window. Using defaults.",
        e.message
      );
      loadedSyllabi = deepClone(DEFAULT_SYLLABI);
    }
  } else {
    loggingService.logInfo(
      `No user_syllabi.js found on window or it was empty. Using default syllabi (${loadedSyllabi.length} syllabi).`
    );
  }
  return loadedSyllabi;
}

export const useSyllabiStore = defineStore("syllabi", {
  state: () => {
    const initialSyllabi = getInitialSyllabi(); // getInitialSyllabi loads from window or defaults
    return {
      allSyllabi: initialSyllabi as Syllabus[],
      isLoading: false, // To indicate when SHARP import is in progress
      isDirty: false,
      lastLoadedSyllabiSnapshot: JSON.stringify(initialSyllabi),
    };
  },

  actions: {
    _updateAndCheckDirty() {
      // ... (implementation as before)
      const currentSnapshot = JSON.stringify(this.allSyllabi);
      if (currentSnapshot !== this.lastLoadedSyllabiSnapshot) {
        this.isDirty = true;
        loggingService.logInfo(
          "Syllabi collection has been modified. Changes pending save."
        );
      } else {
        this.isDirty = false;
      }
    },

    setAllSyllabi(newSyllabi: Syllabus[]) {
      // ... (implementation as before)
      this.allSyllabi = deepClone(newSyllabi);
      this.lastLoadedSyllabiSnapshot = JSON.stringify(this.allSyllabi);
      // When setting all syllabi (e.g., from an import), consider if it should be immediately dirty
      // or if this new set becomes the "pristine" state.
      // Let's assume an import means it's a new baseline, so it becomes dirty if different from defaults,
      // or simply mark as dirty to prompt user to review and save.
      this.isDirty = true; // Or call _updateAndCheckDirty if you want to compare with previous snapshot
      loggingService.logInfo(
        `All syllabi programmatically replaced. ${newSyllabi.length} syllabi loaded.`
      );
    },

    // ... addSyllabus, updateSyllabus, removeSyllabus, resetToDefaults, markAsSaved, downloadSyllabi actions ...
    // (Ensure these actions call this._updateAndCheckDirty() or set this.isDirty = true)

    /**
     * Imports syllabi from a SHARP Syllabus Export Excel file.
     * Uses excelProcessorService to parse the file.
     */
    async importSyllabiFromSharpExport(file: File) {
      const uiStore = useUiStore(); // Get UI store for notifications/loading
      this.isLoading = true;
      uiStore.setLoading(true); // Optional: Set global loading indicator
      uiStore.addNotification({
        message: `Importing syllabus from "${file.name}"...`,
        type: "info",
      });
      loggingService.logInfo(
        `Attempting to import syllabi from SHARP export: ${file.name}`
      );

      try {
        // Call the actual parsing function from your excelProcessorService
        const importedSyllabi = await excelSyllabusProcessorService(file);

        if (importedSyllabi && importedSyllabi.length > 0) {
          // Replace current syllabi in the store with the newly imported ones
          this.setAllSyllabi(importedSyllabi); // This action handles cloning and snapshot
          loggingService.logInfo(
            `${importedSyllabi.length} syllabi successfully parsed and loaded from SHARP file: ${file.name}`
          );
          uiStore.addNotification({
            message: `${importedSyllabi.length} syllabi imported successfully from "${file.name}". Please review and download to persist.`,
            type: "success",
            duration: 7000,
          });
        } else {
          loggingService.logWarn(
            `No syllabi were extracted from the SHARP file: ${file.name}. The file might be empty, in an unexpected format, or no valid syllabi were found.`
          );
          console.log(importedSyllabi);
          uiStore.addNotification({
            message: `No valid syllabi found in "${file.name}". Please check the file format and content.`,
            type: "warning",
            duration: 10000,
          });
        }
      } catch (error: any) {
        loggingService.logError(
          `Error during SHARP syllabus import: ${file.name}`,
          error
        );
        uiStore.addNotification({
          message: `Failed to import syllabi from "${file.name}": ${
            error.message || "Unknown error"
          }`,
          type: "error",
          duration: 10000,
        });
      } finally {
        this.isLoading = false;
        uiStore.setLoading(false); // Clear global loading indicator
      }
    },

    // Make sure other CRUD actions also set the dirty flag appropriately:
    addSyllabus(syllabus: Syllabus) {
      const uiStore = useUiStore(); // Get UI store for notifications/loading
      if (this.allSyllabi.some((s) => s.id === syllabus.id)) {
        loggingService.logWarn(
          `Syllabus with ID ${syllabus.id} already exists.`
        );
        uiStore.addNotification({
          message: `Syllabus with ID "${syllabus.id}" already exists.`,
          type: "warning",
        });
        return;
      }
      this.allSyllabi.push(deepClone(syllabus));
      this.isDirty = true; // Mark as dirty
      loggingService.logInfo(
        `Syllabus "${syllabus.name}" (ID: ${syllabus.id}) added.`
      );
    },

    updateSyllabus(syllabusId: string, updatedSyllabusData: Partial<Syllabus>) {
      const index = this.allSyllabi.findIndex((s) => s.id === syllabusId);
      if (index !== -1) {
        this.allSyllabi[index] = {
          ...this.allSyllabi[index],
          ...deepClone(updatedSyllabusData),
        };
        if (updatedSyllabusData.requirements) {
          // Ensure deep clone of requirements if replaced
          this.allSyllabi[index].requirements = deepClone(
            updatedSyllabusData.requirements
          );
        }
        this.isDirty = true; // Mark as dirty
        loggingService.logInfo(`Syllabus ID ${syllabusId} updated.`);
      } else {
        loggingService.logWarn(
          `Syllabus with ID ${syllabusId} not found for update.`
        );
      }
    },

    removeSyllabus(syllabusId: string) {
      const initialLength = this.allSyllabi.length;
      this.allSyllabi = this.allSyllabi.filter((s) => s.id !== syllabusId);
      if (this.allSyllabi.length < initialLength) {
        this.isDirty = true; // Mark as dirty
        loggingService.logInfo(`Syllabus ID ${syllabusId} removed.`);
      } else {
        loggingService.logWarn(
          `Syllabus with ID ${syllabusId} not found for removal.`
        );
      }
    },
    resetToDefaults() {
      const defaultClonedSyllabi = getInitialSyllabi(); //This will check window first, then defaults.
      //If we want to reset purely to compiled defaults:
      // this.allSyllabi = deepClone(defaultSyllabi);
      this.allSyllabi = defaultClonedSyllabi;
      this.lastLoadedSyllabiSnapshot = JSON.stringify(this.allSyllabi); // New baseline
      this.isDirty = false; // Resetting to the effective defaults means it's no longer "dirty" from that state.
      // Or, if reset should always imply a "change to be saved", set to true.
      // Let's consider resetting to defaults a "clean state" from user perspective.
      loggingService.logInfo(
        "Syllabi collection reset to initial state (user file or defaults)."
      );
    },

    /**
     * Generates a .js file containing the current syllabi data and initiates a download.
     */
    downloadSyllabi() {
      try {
        const fileContent =
          "// UPSHOT User Syllabi File\n// Place this file in the same directory as your main upshot.html file.\nwindow.UPSHOT_USER_SYLLABI = " +
          JSON.stringify(this.allSyllabi, null, 2) + // Using null, 2 for pretty-printing
          ";";

        const blob = new Blob([fileContent], {
          type: "text/javascript;charset=utf-8",
        });

        saveAs(blob, "user_syllabi.js");

        // After successfully initiating the download, mark the state as saved.
        this.markAsSaved();
      } catch (error) {
        loggingService.logError(
          "Failed to prepare syllabi for download.",
          error
        );
        useUiStore().addNotification({
          message: "An error occurred while preparing the download.",
          type: "error",
        });
      }
    },

    markAsSaved() {
      this.lastLoadedSyllabiSnapshot = JSON.stringify(this.allSyllabi);
      this.isDirty = false;
      loggingService.logInfo(
        "Current syllabi collection marked as saved/downloaded."
      );
    },

    /**
     * Finds a syllabus by the assigned position and year.
     * @param position - The assigned position (e.g., "PILOT").
     * @param year - The syllabus year (e.g., "2023").
     * @returns The matching Syllabus object or undefined if not found.
     */
    findSyllabus(position: string, year: string): Syllabus | undefined {
      return this.allSyllabi.find(
        (s) =>
          s.position.toUpperCase() === position.toUpperCase() && s.year === year
      );
    },
  },

  getters: {
    getSyllabusById:
      (state) =>
      (id: string): Syllabus | undefined => {
        return state.allSyllabi.find((s) => s.id === id);
      },
    getSyllabusByPositionAndYear:
      (state) =>
      (position: string, year: string): Syllabus | undefined => {
        return state.allSyllabi.find(
          (s) =>
            s.position.toUpperCase() === position.toUpperCase() &&
            s.year === year
        );
      },
    getRequirementsForSyllabus:
      (state) =>
      (position: string, year: string, level?: number): Requirement[] => {
        const syllabus = state.allSyllabi.find(
          (s) =>
            s.position.toUpperCase() === position.toUpperCase() &&
            s.year === year
        );
        if (!syllabus) return [];
        return level === undefined
          ? syllabus.requirements
          : syllabus.requirements.filter((req) => req.level === level);
      },
    getAvailablePositions: (state): string[] => {
      const positions = new Set(state.allSyllabi.map((s) => s.position));
      return Array.from(positions).sort();
    },
    getAvailableYearsForPosition:
      (state) =>
      (position: string): string[] => {
        const years = new Set(
          state.allSyllabi
            .filter((s) => s.position.toUpperCase() === position.toUpperCase())
            .map((s) => s.year)
        );
        return Array.from(years).sort((a, b) => b.localeCompare(a));
      },
    getAvailableLevels:
      (state) =>
      (position: string, year: string): number[] => {
        const levels = new Set<number>();
        const syllabus = state.allSyllabi.find(
          (s) =>
            s.position.toUpperCase() === position.toUpperCase() &&
            s.year === year
        );
        if (syllabus) {
          syllabus.requirements.forEach((req) => levels.add(req.level));
        }
        return Array.from(levels).sort((a, b) => a - b);
      },
  },
});
