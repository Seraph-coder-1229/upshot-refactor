import { defineStore } from "pinia";
import { type Upgrader } from "../types/personnelTypes";
import { useUiStore } from "./uiStore";
import { processPersonnelFile } from "../core/excelProcessorServices/personnelProcessorService";

// Helper function to create a map for quick lookups
const createPersonnelMap = (personnel: Upgrader[]): Map<string, Upgrader> => {
  return new Map(personnel.map((p) => [p.id, p]));
};

export const usePersonnelStore = defineStore("personnel", {
  /**
   * State for personnel management.
   */
  state: () => ({
    /**
     * Holds all personnel records.
     * @type {Upgrader[]}
     */
    allPersonnel: [] as Upgrader[],
    /**
     * A map for quick personnel lookup by their ID.
     * @type {Map<string, Upgrader>}
     */
    personnelMap: new Map<string, Upgrader>(),
    /**
     * Tracks if there are unsaved changes.
     * @type {boolean}
     */
    isDirty: false,
    /**
     * Tracks if the initial personnel data has been loaded.
     * @type {boolean}
     */
    isDataLoaded: false,
  }),

  /**
   * Getters for derived state.
   */
  getters: {
    /**
     * Returns a function to get a person by their ID.
     * @param state - The store's state.
     * @returns {(id: string) => Upgrader | undefined} A function that takes an ID and returns the corresponding upgrader or undefined.
     */
    getPersonnelById: (state) => {
      return (id: string): Upgrader | undefined => state.personnelMap.get(id);
    },
    /**
     * Returns all personnel sorted by name.
     * @param state - The store's state.
     * @returns {Upgrader[]} A sorted array of upgraders.
     */
    allPersonnelSortedByName: (state): Upgrader[] => {
      return [...state.allPersonnel].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    },
  },

  /**
   * Actions for mutating the state.
   */
  actions: {
    /**
     * Processes a personnel Excel file and loads the data into the store.
     * Handles UI feedback for loading and error states.
     * @param {File} file - The personnel Excel file uploaded by the user.
     */
    async loadPersonnelFromFile(file: File) {
      const uiStore = useUiStore();
      uiStore.setGlobalLoading(true);
      uiStore.addNotification({
        message: "Processing personnel file...",
        type: "info",
        duration: 3000,
      });

      try {
        // Call the processor to get the personnel data
        const personnelList = await processPersonnelFile(file);

        // Use the existing action to set the store's state
        this.setPersonnel(personnelList);

        if (personnelList.length > 0) {
          uiStore.addNotification({
            message: `Successfully loaded ${personnelList.length} personnel records.`,
            type: "success",
          });
        } else {
          uiStore.addNotification({
            message:
              "Processed file, but no personnel records were found. Please check the file content.",
            type: "warning",
          });
        }
      } catch (error) {
        console.error("Failed to process personnel file:", error);
        uiStore.addNotification({
          message:
            "An error occurred while processing the personnel file. See console for details.",
          type: "error",
        });
      } finally {
        uiStore.setGlobalLoading(false);
      }
    },

    /**
     * Sets the personnel data, replacing any existing data.
     * @param {Upgrader[]} personnelList - The list of personnel to load.
     */
    setPersonnel(personnelList: Upgrader[]) {
      try {
        this.allPersonnel = personnelList;
        this.personnelMap = new Map(personnelList.map((p) => [p.id, p]));
        this.isDataLoaded = true;
        this.isDirty = false;
      } catch (error) {
        const uiStore = useUiStore();
        uiStore.addNotification({
          message: "Failed to set personnel data in the store.",
          type: "error",
        });
        console.error("Error setting personnel:", error);
      }
    },

    /**
     * Adds a single new person to the store.
     * @param {Upgrader} upgrader - The person to add.
     */
    addPersonnel(upgrader: Upgrader) {
      if (this.personnelMap.has(upgrader.id)) {
        console.warn(
          `Personnel with ID ${upgrader.id} already exists. Use updatePersonnel instead.`
        );
        return;
      }
      this.allPersonnel.push(upgrader);
      this.personnelMap.set(upgrader.id, upgrader);
      this.isDirty = true;
    },

    /**
     * Updates an existing person's data.
     * @param {Upgrader} upgrader - The person to update.
     */
    updatePersonnel(upgrader: Upgrader) {
      const index = this.allPersonnel.findIndex((p) => p.id === upgrader.id);
      if (index === -1) {
        console.warn(
          `Personnel with ID ${upgrader.id} not found. Cannot update.`
        );
        return;
      }
      this.allPersonnel[index] = upgrader;
      this.personnelMap.set(upgrader.id, upgrader);
      this.isDirty = true;
    },

    /**
     * Clears all personnel data from the store.
     */
    clearPersonnel() {
      this.allPersonnel = [];
      this.personnelMap.clear();
      this.isDataLoaded = false;
      this.isDirty = false;
    },
  },
});
