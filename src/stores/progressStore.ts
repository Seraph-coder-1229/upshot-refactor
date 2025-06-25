// src/stores/progressStore.ts

import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid"; // A library for generating unique IDs. Run `npm install uuid`
import type { DataSet } from "@/types/dataSetTypes";
// The import path is now updated based on your feedback
import type { ImportReport } from "@/types/reportTypes";
import { processFilesToDataSet } from "@/core/services/trainingDataProcessorService"; // Assuming the processor service will be created here
import { loggingService } from "@/utils/loggingService";
import { CompletedItemRecord } from "@/types/syllabiTypes";

// Define the state shape for our store
interface ProgressState {
  /**
   * Stores all loaded training data, with each DataSet keyed by its unique ID.
   * Using a Map is efficient for lookups, additions, and deletions.
   */
  dataSets: Map<string, DataSet>;

  /**
   * The ID of the currently selected DataSet. When this is set, the application
   * is in "Single Report View".
   * Is `null` when in "Department View".
   */
  activeDataSetId: string | null;

  /**
   * An array of DataSet IDs that the user has selected for aggregation.
   * This is used to create the "Department View".
   */
  selectedDataSetIdsForAggregation: string[];
}

export const useProgressStore = defineStore("progress", {
  state: (): ProgressState => ({
    dataSets: new Map(),
    activeDataSetId: null,
    selectedDataSetIdsForAggregation: [],
  }),

  getters: {
    /**
     * Returns the full DataSet object for the currently active context.
     */
    activeDataSet(state): DataSet | undefined {
      if (!state.activeDataSetId) return undefined;
      return state.dataSets.get(state.activeDataSetId);
    },

    /**
     * Returns a single, combined array of all completion records from the DataSets
     * selected for aggregation. This is the primary data source for the "Department View".
     */
    aggregatedCompletionRecords(state): CompletedItemRecord[] {
      return state.selectedDataSetIdsForAggregation.flatMap(
        (id) => state.dataSets.get(id)?.completionRecords || []
      );
    },

    /**
     * A convenience getter to get a list of all DataSets for UI display.
     */
    allDataSets(state): DataSet[] {
      return Array.from(state.dataSets.values());
    },
  },

  actions: {
    /**
     * Processes uploaded files, creates a new DataSet, and adds it to the store.
     * This is the primary action for importing new data.
     * @param {File[]} files - The array of files from the file input.
     */
    async addDataSet(files: File[]) {
      // NOTE: The 'processFilesToDataSet' function will need to be created in the
      // trainingDataProcessorService. It does the core work of parsing the files.
      const processedData = await processFilesToDataSet(files);

      const newDataSet: DataSet = {
        id: uuidv4(),
        name: `Report uploaded on ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        // Spread the results from the processor into the new DataSet
        ...processedData,
      };

      this.dataSets.set(newDataSet.id, newDataSet);
      // As a good UX measure, automatically set the newly uploaded report as active.
      this.setActiveDataSet(newDataSet.id);
    },

    /**
     * Deletes a DataSet from the store.
     * @param {string} dataSetId - The ID of the DataSet to remove.
     */
    removeDataSet(dataSetId: string) {
      this.dataSets.delete(dataSetId);
      // If the deleted DataSet was the active one, reset the active context.
      if (this.activeDataSetId === dataSetId) {
        this.activeDataSetId = null;
      }
      // Also remove it from the aggregation list if it's there.
      this.selectedDataSetIdsForAggregation =
        this.selectedDataSetIdsForAggregation.filter((id) => id !== dataSetId);
      loggingService.logInfo(
        `DataSet with ID ${dataSetId} has been removed from the store.`
      );
    },

    /**
     * Updates the user-editable name of a DataSet.
     * @param {string} dataSetId - The ID of the DataSet to rename.
     * @param {string} newName - The new name for the DataSet.
     */
    renameDataSet(dataSetId: string, newName: string) {
      const dataSet = this.dataSets.get(dataSetId);
      if (dataSet) {
        dataSet.name = newName;
      }
    },

    /**
     * Sets the active context for the application to a single DataSet.
     * @param {string | null} dataSetId - The ID of the DataSet to view, or null to clear.
     */
    setActiveDataSet(dataSetId: string | null) {
      this.activeDataSetId = dataSetId;
    },

    /**
     * Adds or removes a DataSet from the list of those used for aggregation.
     * @param {string} dataSetId - The ID of the DataSet to toggle.
     */
    toggleDataSetForAggregation(dataSetId: string) {
      const index = this.selectedDataSetIdsForAggregation.indexOf(dataSetId);
      if (index > -1) {
        this.selectedDataSetIdsForAggregation.splice(index, 1);
      } else {
        this.selectedDataSetIdsForAggregation.push(dataSetId);
      }
    },
  },
});
