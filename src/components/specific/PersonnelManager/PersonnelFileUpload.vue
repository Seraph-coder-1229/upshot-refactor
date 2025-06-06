<template>
  <div class="p-4 bg-gray-50 border rounded-lg shadow-sm">
    <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
      Personnel Data
    </h3>
    <div class="flex items-center space-x-4">
      <button
        @click="triggerFileInput"
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Load Personnel File (.xlsx)
      </button>

      <button
        @click="handleDownloadData"
        type="button"
        :disabled="
          !personnelStore.isDataLoaded ||
          personnelStore.allPersonnel.length === 0
        "
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Download Current Data
      </button>

      <button
        @click="handleDownloadTemplate"
        type="button"
        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Download Template
      </button>

      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        @change="handleFileSelected"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import {
  downloadPersonnelTemplate,
  downloadPersonnelData,
} from "@/core/excelProcessorServices/personnelProcessorService";

const personnelStore = usePersonnelStore();
const fileInput = ref<HTMLInputElement | null>(null);

// Triggers the hidden file input click event
const triggerFileInput = () => {
  fileInput.value?.click();
};

// Handles the file selection and calls the store action
const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    personnelStore.loadPersonnelFromFile(file);
  }
  // Reset the input value to allow re-uploading the same file
  if (target) {
    target.value = "";
  }
};

// Calls the template download function
const handleDownloadTemplate = () => {
  downloadPersonnelTemplate();
};

const handleDownloadData = () => {
  downloadPersonnelData(personnelStore.allPersonnel);
};
</script>
