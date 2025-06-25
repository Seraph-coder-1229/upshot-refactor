<template>
    <div class="context-selector-wrapper">
      <label for="context-select" class="selector-label">Current View:</label>
      <select id="context-select" v-model="selectedContext" class="context-select">
        <option :value="AGGREGATED_VIEW_ID">
          Department View (Aggregated)
        </option>
  
        <option disabled>──────────────────</option>
  
        <option v-for="dataSet in allDataSets" :key="dataSet.id" :value="dataSet.id">
          {{ dataSet.name }}
        </option>
      </select>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useProgressStore } from '@/stores/progressStore';
  
  const progressStore = useProgressStore();
  
  // A special constant to represent the aggregated view in the dropdown
  const AGGREGATED_VIEW_ID = 'department-view';
  
  // Computed property to get the list of all DataSets from the store
  const allDataSets = computed(() => progressStore.allDataSets);
  
  /**
   * This computed property with a getter and setter creates a two-way binding
   * between the dropdown's value and the Pinia store's state.
   */
  const selectedContext = computed({
    // GET: Determine what should be selected in the dropdown
    get() {
      // If an activeDataSetId is set, that's our selection.
      // Otherwise, we are in the aggregated view.
      return progressStore.activeDataSetId ?? AGGREGATED_VIEW_ID;
    },
    // SET: Called when the user selects a new option
    set(newValue) {
      if (newValue === AGGREGATED_VIEW_ID) {
        // If the user selects "Department View", clear the activeDataSetId.
        // The application will then use the `selectedDataSetIdsForAggregation` array.
        progressStore.setActiveDataSet(null);
      } else {
        // If the user selects a specific DataSet, set it as active.
        progressStore.setActiveDataSet(newValue);
      }
    },
  });
  </script>
  
  <style scoped>
  /* Basic styling for the selector. Can be adapted to your design system. */
  .context-selector-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: 2rem; /* Give it some space from other nav items */
  }
  .selector-label {
    font-weight: 500;
    color: #a0aec0; /* Example color: text-gray-400 in Tailwind */
  }
  .context-select {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0; /* Example color: border-gray-300 */
    background-color: white;
    font-weight: 600;
    min-width: 250px;
  }
  </style>