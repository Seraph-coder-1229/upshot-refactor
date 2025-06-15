<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <div class="border-b border-gray-200 pb-5">
      <div class="sm:flex sm:items-baseline sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900">
            Personnel Roster
          </h1>
          <p class="mt-2 text-sm text-gray-500">
            Upload, view, and manage your squadron's personnel data.
          </p>
        </div>
        <div class="mt-4 flex items-center justify-start sm:mt-0 sm:ml-4">
          <button
            @click="handleDownloadTemplate"
            type="button"
            class="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ArrowDownTrayIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
            <span>Download Template</span>
          </button>
          <button
            @click="handleDownloadData"
            type="button"
            :disabled="!isPersonnelLoaded"
            class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
          >
            <DocumentArrowDownIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
            <span>Download Current Roster</span>
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <h2 class="text-lg font-medium text-gray-900">Upload Roster File</h2>
        <p class="mt-1 text-sm text-gray-500">
          Upload an Excel file with your personnel data. Use the template for
          the correct format.
        </p>
        <div
          class="mt-4 relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
          :class="{ 'bg-indigo-50 border-indigo-500': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".xlsx, .xls"
            @change="handleFileInput"
          />
          <div class="space-y-2">
            <UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
            <p class="text-gray-500">Drag & drop file, or click to browse.</p>
          </div>
        </div>
        <div v-if="newlyLoadedPersonnel.length > 0" class="mt-4">
          <button
            @click="confirmLoad"
            type="button"
            class="w-full inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
          >
            Confirm and Save {{ newlyLoadedPersonnel.length }} Records
          </button>
        </div>
      </div>

      <div class="lg:col-span-2">
        <h2 class="text-lg font-medium text-gray-900">
          {{ uploadAttempted ? "Upload Preview" : "Current Roster" }}
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          {{
            uploadAttempted
              ? 'Review the data below. Click "Confirm and Save" to replace the current roster.'
              : "This is the personnel data currently loaded in the application."
          }}
        </p>
        <div class="mt-4 flow-root">
          <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div
              class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8"
            >
              <div
                v-if="uploadAttempted && tableData.length === 0"
                class="text-center py-10 px-4 rounded-lg bg-yellow-50 border border-yellow-200"
              >
                <ExclamationTriangleIcon
                  class="mx-auto h-12 w-12 text-yellow-400"
                />
                <h3 class="mt-2 text-sm font-semibold text-yellow-800">
                  No Valid Records Found
                </h3>
                <p class="mt-1 text-sm text-yellow-700">
                  The file was processed, but no valid personnel records were
                  found. Please ensure the column headers in your file exactly
                  match the provided template.
                </p>
                <div class="mt-4">
                  <button
                    @click="handleDownloadTemplate"
                    type="button"
                    class="text-sm font-medium text-yellow-800 hover:text-yellow-700 underline"
                  >
                    Download Template
                  </button>
                </div>
              </div>
              <PersonnelTable v-else :personnel="tableData" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useUiStore } from "@/stores/uiStore";
import {
  processPersonnelFile,
  downloadPersonnelTemplate,
  downloadPersonnelData,
} from "@/core/excelProcessorServices/personnelProcessorService";
import PersonnelTable from "@/components/specific/PersonnelManager/PersonnelTable.vue";
import type { Upgrader } from "@/types/personnelTypes";
import {
  UsersIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const personnelStore = usePersonnelStore();
const uiStore = useUiStore();

const isPersonnelLoaded = computed(() => personnelStore.isDataLoaded);
const newlyLoadedPersonnel = ref<Upgrader[]>([]);
const uploadAttempted = ref(false);

const tableData = computed(
  () =>
    (uploadAttempted.value
      ? newlyLoadedPersonnel.value
      : personnelStore.allPersonnel) || []
);

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) processFile(files[0]);
};

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) processFile(files[0]);
};

const processFile = async (file: File) => {
  if (!file) return;
  uploadAttempted.value = true;
  uiStore.setGlobalLoading(true);
  try {
    const processedData = await processPersonnelFile(file);
    newlyLoadedPersonnel.value = processedData;

    if (processedData.length > 0) {
      uiStore.addNotification({
        message: `${processedData.length} records loaded for preview.`,
        type: "info",
      });
    } else {
      uiStore.addNotification({
        message: "No valid records found in file. Check column headers.",
        type: "warn",
        duration: 8000,
      });
    }
  } catch (error: any) {
    uiStore.addNotification({
      message: `Error processing file: ${error.message}`,
      type: "error",
    });
    newlyLoadedPersonnel.value = [];
  } finally {
    uiStore.setGlobalLoading(false);
    if (fileInput.value) fileInput.value.value = "";
  }
};

const handleDownloadTemplate = () => {
  downloadPersonnelTemplate();
};

const handleDownloadData = () => {
  if (personnelStore.allPersonnel.length > 0) {
    downloadPersonnelData(personnelStore.allPersonnel);
  } else {
    uiStore.addNotification({
      message: "No personnel data loaded to download.",
      type: "warn",
    });
  }
};

const confirmLoad = () => {
  if (newlyLoadedPersonnel.value.length > 0) {
    personnelStore.setPersonnel(newlyLoadedPersonnel.value);
    uiStore.addNotification({
      message: "Personnel roster has been updated.",
      type: "success",
    });
    newlyLoadedPersonnel.value = [];
    uploadAttempted.value = false;
    router.push({ name: "Dashboard" });
  }
};
</script>
