<template>
    <div class="data-manager-view">
      <header class="page-header">
        <h1>Data Set Manager</h1>
        <p>Manage all imported training reports. Rename, delete, or select reports for aggregated department-level viewing.</p>
      </header>
  
      <div class="actions-toolbar">
        <button @click="handleNewUpload">Upload New Report</button>
      </div>
  
      <div class="dataset-list-container">
        <h2>Loaded Data Sets</h2>
        <ul v-if="allDataSets.length > 0" class="dataset-list">
          <li v-for="dataSet in allDataSets" :key="dataSet.id" class="dataset-item">
            <div class="dataset-info">
              <span class="dataset-name">{{ dataSet.name }}</span>
              <span class="dataset-details">
                Created: {{ new Date(dataSet.createdAt).toLocaleDateString() }} |
                {{ dataSet.importSummary.recordsProcessed }} records
              </span>
            </div>
            <div class="dataset-actions">
              <button class="icon-button" title="Rename">✏️</button>
              <button class="icon-button" title="Delete" @click="handleDelete(dataSet.id)">🗑️</button>
              <div class="aggregation-toggle">
                <label :for="`agg-${dataSet.id}`">Include in Dept. View:</label>
                <input
                  type="checkbox"
                  :id="`agg-${dataSet.id}`"
                  :checked="isDataSetSelectedForAggregation(dataSet.id)"
                  @change="handleToggleAggregation(dataSet.id)"
                />
              </div>
            </div>
          </li>
        </ul>
        <div v-else class="empty-state">
          <p>No data sets have been uploaded yet.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useProgressStore } from '@/stores/progressStore';
  import { useRouter } from 'vue-router';
  
  const progressStore = useProgressStore();
  const router = useRouter();
  
  // Use a computed property to reactively get the list of data sets
  const allDataSets = computed(() => progressStore.allDataSets);
  
  const isDataSetSelectedForAggregation = (dataSetId: string) => {
    return progressStore.selectedDataSetIdsForAggregation.includes(dataSetId);
  };
  
  const handleToggleAggregation = (dataSetId: string) => {
    progressStore.toggleDataSetForAggregation(dataSetId);
  };
  
  const handleDelete = (dataSetId: string) => {
    if (confirm('Are you sure you want to delete this data set? This action cannot be undone.')) {
      progressStore.removeDataSet(dataSetId);
    }
  };
  
  const handleNewUpload = () => {
    // Navigate to the existing upload view
    router.push('/training-upload'); // Assuming this is the path for the upload view
  };
  </script>
  
  <style scoped>
  /* Basic styling for layout and clarity - can be replaced with a design system */
  .data-manager-view {
    padding: 2rem;
  }
  .page-header {
    margin-bottom: 2rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 1rem;
  }
  .actions-toolbar {
    margin-bottom: 2rem;
  }
  .dataset-list {
    list-style: none;
    padding: 0;
  }
  .dataset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 1rem;
    background-color: #f9f9f9;
  }
  .dataset-info {
    display: flex;
    flex-direction: column;
  }
  .dataset-name {
    font-weight: bold;
    font-size: 1.1rem;
  }
  .dataset-details {
    font-size: 0.9rem;
    color: #666;
  }
  .dataset-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .aggregation-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #777;
  }
  </style>