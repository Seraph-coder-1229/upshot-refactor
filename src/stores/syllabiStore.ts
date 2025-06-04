// src/stores/syllabiStore.ts
import { defineStore } from "pinia";
import { type Syllabus } from "../types/syllabiTypes";
import { defaultSyllabi } from "../config/syllabiDefaults";
import { loggingService } from "../utils/loggingService";
import { saveAs } from "file-saver"; // For downloading
import { APP_VERSION } from "../config/constants"; // Assuming APP_VERSION is in constants.ts
import { deepClone } from "@/utils/dataUtils";

// Function to get the initial syllabi
function getInitialSyllabi(): Syllabus[] {
  let loadedSyllabi = deepClone(defaultSyllabi); // Start with built-in defaults

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
        loadedSyllabi = deepClone(defaultSyllabi);
      }
    } catch (e: any) {
      loggingService.logError(
        "Error processing user_syllabi from window. Using defaults.",
        e.message
      );
      loadedSyllabi = deepClone(defaultSyllabi);
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
    const initialSyllabi = getInitialSyllabi();
    return {
      allSyllabi: initialSyllabi as Syllabus[],
      isLoading: false,
      isDirty: false,
      lastLoadedSyllabiSnapshot: JSON.stringify(initialSyllabi),
    };
  },

  actions: {
    _updateAndCheckDirty() {
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

    /**
     * Replaces the entire syllabi collection.
     * Used by SHARP import or future direct load features.
     */
    setAllSyllabi(newSyllabi: Syllabus[]) {
      this.allSyllabi = deepClone(newSyllabi);
      this.lastLoadedSyllabiSnapshot = JSON.stringify(this.allSyllabi);
      this.isDirty = false; // Loading new set is considered pristine initially
      loggingService.logInfo(
        `All syllabi replaced. ${newSyllabi.length} syllabi loaded.`
      );
    },

    addSyllabus(syllabus: Syllabus) {
      // Check for duplicates by ID before adding
      if (this.allSyllabi.some((s) => s.id === syllabus.id)) {
        loggingService.logWarn(
          `Syllabus with ID ${syllabus.id} already exists. Cannot add duplicate.`
        );
        // Optionally, throw an error or notify UI
        return;
      }
      this.allSyllabi.push(deepClone(syllabus));
      this._updateAndCheckDirty();
      loggingService.logInfo(
        `Syllabus "${syllabus.name}" (ID: ${syllabus.id}) added.`
      );
    },

    updateSyllabus(syllabusId: string, updatedSyllabusData: Partial<Syllabus>) {
      const index = this.allSyllabi.findIndex((s) => s.id === syllabusId);
      if (index !== -1) {
        // Merge updates carefully to maintain reactivity on the object
        this.allSyllabi[index] = {
          ...this.allSyllabi[index],
          ...deepClone(updatedSyllabusData),
        };
        // If requirements array is replaced, ensure it's also reactive
        if (updatedSyllabusData.requirements) {
          this.allSyllabi[index].requirements = deepClone(
            updatedSyllabusData.requirements
          );
        }
        this._updateAndCheckDirty();
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
        this._updateAndCheckDirty();
        loggingService.logInfo(`Syllabus ID ${syllabusId} removed.`);
      } else {
        loggingService.logWarn(
          `Syllabus with ID ${syllabusId} not found for removal.`
        );
      }
    },

    // TODO: Add actions for managing requirements within a specific syllabus
    // addRequirementToSyllabus(syllabusId: string, requirement: Requirement)
    // updateRequirementInSyllabus(syllabusId: string, requirementId: string, updatedRequirement: Partial<Requirement>)
    // removeRequirementFromSyllabus(syllabusId: string, requirementId: string)

    resetToDefaults() {
      this.allSyllabi = deepClone(defaultSyllabi);
      this.isDirty = true; // Resetting is a change from potentially saved user state
      loggingService.logInfo(
        "Syllabi reset to defaults. Changes are now dirty."
      );
    },

    markAsSaved() {
      this.lastLoadedSyllabiSnapshot = JSON.stringify(this.allSyllabi);
      this.isDirty = false;
      loggingService.logInfo("Current syllabi collection marked as saved.");
    },

    downloadSyllabi() {
      loggingService.logInfo("Download current syllabi initiated.");
      try {
        const syllabiString = JSON.stringify(this.allSyllabi, null, 2);
        const fileContent = `// UPSHOT Application User Syllabi
// Timestamp: ${new Date().toISOString()}
// App Version at Save: ${APP_VERSION}
//
// To use this file:
// 1. Save it (or rename this downloaded file) as 'user_syllabi.js'
// 2. Create a folder named 'syllabi' in the same directory as your UPSHOT index.html file.
// 3. Place 'user_syllabi.js' inside that 'syllabi' folder (e.g., ./syllabi/user_syllabi.js).
// 4. Reload the UPSHOT application.
window.UPSHOT_USER_SYLLABI = ${syllabiString};
`;
        const blob = new Blob([fileContent], {
          type: "application/javascript;charset=utf-8",
        });
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\..+/, "");
        const filename = `upshot_syllabi_download_${timestamp}.js`;

        saveAs(blob, filename);
        this.markAsSaved();
        loggingService.logInfo(
          `Syllabi downloaded as ${filename}. User needs to place it correctly.`
        );
      } catch (error: any) {
        loggingService.logError(
          "Error preparing or downloading syllabi:",
          error
        );
      }
    },

    // Action for importing from the SHARP Syllabus Export Excel - to be fully implemented later
    async importSyllabiFromSharpExport(file: File) {
      this.isLoading = true;
      loggingService.logInfo(
        `Importing syllabi from SHARP export: ${file.name}`
      );
      try {
        // const { excelProcessorService } = await import('../core/excelProcessorService'); // Lazy load if it's large
        // const importedSyllabi = await excelProcessorService.parseSharpSyllabusExport(file);
        // this.setAllSyllabi(importedSyllabi); // Replace current syllabi
        // loggingService.logInfo(`${importedSyllabi.length} syllabi imported from SHARP file.`);
        // uiStore.addNotification({ message: 'SHARP Syllabi imported successfully!', type: 'success' });
        loggingService.logWarn(
          "SHARP Syllabus Export parsing not yet fully implemented."
        );
        // For now, simulate:
        this.addSyllabus({
          id: "TEMP_FROM_SHARP",
          name: "Temp Syllabus from SHARP",
          position: "PILOT",
          level: 200,
          year: "2025",
          requirements: [],
          wingGoalMonths: 1,
          squadronGoalMonths: 1,
          displayName: "Temp Syllabus from Sharp",
        });
      } catch (error: any) {
        loggingService.logError(
          `Error importing syllabi from SHARP export: ${file.name}`,
          error
        );
        // const uiStore = useUiStore();
        // uiStore.addNotification({ message: `Error importing SHARP syllabi: ${error.message}`, type: 'error' });
      } finally {
        this.isLoading = false;
      }
    },
  },

  getters: {
    getSyllabusById:
      (state) =>
      (id: string): Syllabus | undefined => {
        return state.allSyllabi.find((s) => s.id === id);
      },
    getSyllabiByCriteria:
      (state) =>
      (criteria: {
        position?: string;
        level?: number;
        year?: string;
        type?: "pqs" | "events"; // Note: 'type' is on Requirement now, so this getter needs adjustment
        // or Syllabus needs to retain a primary type if it's still useful at syllabus level.
        // Based on our latest types, a Syllabus is for a position/level/year and contains
        // requirements of both types. So filtering by 'type' at syllabus level might be less direct.
      }): Syllabus[] => {
        return state.allSyllabi.filter((s) => {
          let match = true;
          if (
            criteria.position &&
            s.position.toUpperCase() !== criteria.position.toUpperCase()
          )
            match = false;
          if (criteria.level && s.level !== criteria.level) match = false;
          if (criteria.year && s.year !== criteria.year) match = false;
          // If you need to filter syllabi that *contain* a certain type of requirement, that's more complex.
          // For now, this getter assumes Syllabus might have a primary type or position/level/year is enough.
          return match;
        });
      },
    // Getter to get all distinct positions available in the loaded syllabi
    getAvailablePositions: (state): string[] => {
      const positions = new Set<string>();
      state.allSyllabi.forEach((s) => positions.add(s.position));
      return Array.from(positions).sort();
    },
    // Getter to get all distinct years for a given position
    getAvailableYearsForPosition:
      (state) =>
      (position: string): string[] => {
        const years = new Set<string>();
        state.allSyllabi
          .filter((s) => s.position.toUpperCase() === position.toUpperCase())
          .forEach((s) => years.add(s.year));
        return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending
      },
    // Getter to get all distinct levels for a given position and year
    getAvailableLevels:
      (state) =>
      (position: string, year: string): number[] => {
        const levels = new Set<number>();
        state.allSyllabi
          .filter(
            (s) =>
              s.position.toUpperCase() === position.toUpperCase() &&
              s.year === year
          )
          .forEach((s) => levels.add(s.level));
        return Array.from(levels).sort((a, b) => a - b); // Sort ascending
      },
  },
});
