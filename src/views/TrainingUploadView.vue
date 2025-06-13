<!-- src/views/TrainingUploadView.vue -->
<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold">Training Data Uploader</h1>
    <p class="mt-2 text-gray-600">
      Upload one or more SHARP export files. The data from each file will be
      merged into the main personnel roster.
    </p>

    <!-- Main Workflow -->
    <div class="mt-6">
      <!-- Section to show if NO file is currently staged for confirmation -->
      <div v-if="!isDataPending" class="p-6 border-2 border-dashed rounded-lg">
        <div class="text-center">
          <DocumentArrowUpIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            Upload a SHARP File
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            Completions from the file will be staged for merging.
          </p>
          <div class="mt-6">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              class="sr-only"
              accept=".xlsx, .xls"
            />
            <button
              @click="fileInput?.click()"
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Select File
            </button>
          </div>
        </div>
      </div>

      <!-- Section to show if a file IS staged and ready for confirmation -->
      <div v-else class="p-6 border rounded-lg bg-white shadow">
        <h2 class="text-lg font-medium text-gray-900">Confirm Training Data</h2>
        <p class="mt-1 text-sm text-gray-500">
          A SHARP file has been processed. The application detected the
          following track:
          <strong class="text-indigo-600">{{
            detectedTrack || "Unknown"
          }}</strong
          >.
        </p>
        <p class="mt-1 text-sm text-gray-500">
          Data for
          <strong class="text-indigo-600">{{ pendingDataCount }}</strong>
          student(s) is ready to be merged.
        </p>

        <div class="mt-6 flex justify-end space-x-4">
          <button
            @click="handleDeny"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <XCircleIcon class="h-5 w-5 mr-2 text-red-500" />
            Deny & Upload Another
          </button>
          <button
            @click="handleAccept"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <CheckCircleIcon class="h-5 w-5 mr-2" />
            Accept & Merge
          </button>
        </div>
      </div>
    </div>

    <!-- Done Button -->
    <div class="mt-8 text-center">
      <router-link
        to="/"
        class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        Done & Return to Dashboard &rarr;
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useProgressStore } from "@/stores/progressStore";
import { useUiStore } from "@/stores/uiStore";
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const progressStore = useProgressStore();
const uiStore = useUiStore();
const fileInput = ref<HTMLInputElement | null>(null);

// Computed properties to check the state of the progress store
const isDataPending = computed(() => progressStore.pendingSharpData !== null);
const detectedTrack = computed(() => progressStore.detectedTrack);
const pendingDataCount = computed(
  () => progressStore.pendingSharpData?.size || 0
);

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  const file = target.files[0];
  // We use the existing action from the store, which handles staging one file at a time
  await progressStore.loadAndProcessSharpFile(file);
};

const handleAccept = () => {
  progressStore.confirmAndMergeSharpData();
  // After merging, the UI will automatically reset to the upload state
  // because `isDataPending` will become false.
  if (fileInput.value) fileInput.value.value = ""; // Reset file input
};

const handleDeny = () => {
  progressStore.cancelSharpDataMerge();
  if (fileInput.value) fileInput.value.value = ""; // Reset file input
};
</script>
