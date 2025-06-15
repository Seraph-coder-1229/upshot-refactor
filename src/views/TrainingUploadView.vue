<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <div class="border-b border-gray-200 pb-5">
      <div class="sm:flex sm:items-baseline sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900">
            Load Training Data
          </h1>
          <p class="mt-2 text-sm text-gray-500">
            Upload one or more SHARP Syllabus Export files to merge training
            completions.
          </p>
        </div>
        <div class="mt-4 flex items-center justify-start sm:mt-0 sm:ml-4">
          <router-link
            :to="{ name: 'Dashboard' }"
            class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ArrowLeftIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
            <span>Back to Dashboard</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
      <div class="lg:col-span-1 space-y-6">
        <div>
          <h2 class="text-lg font-medium text-gray-900">1. Stage Files</h2>
          <p class="mt-1 text-sm text-gray-500">
            Drag files into the box below or click to browse. You can add
            multiple files.
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
              multiple
            />
            <div class="space-y-2">
              <DocumentArrowUpIcon class="mx-auto h-12 w-12 text-gray-400" />
              <p class="text-gray-500">
                Drag & drop files, or click to browse.
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2 class="text-lg font-medium text-gray-900">2. Process Files</h2>
          <p class="mt-1 text-sm text-gray-500">
            Review your staged files, then click below to process them all.
          </p>
          <button
            @click="processStagedFiles"
            type="button"
            :disabled="stagedFiles.length === 0"
            class="mt-4 w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400"
          >
            Process {{ stagedFiles.length }} Staged Files
          </button>
        </div>
      </div>

      <div class="lg:col-span-1">
        <h2 class="text-lg font-medium text-gray-900">Staging Area</h2>
        <div class="mt-4 flow-root">
          <ul
            v-if="stagedFiles.length > 0"
            role="list"
            class="divide-y divide-gray-200 border-t border-b border-gray-200"
          >
            <li
              v-for="(file, index) in stagedFiles"
              :key="file.name + index"
              class="flex items-center space-x-4 p-3 bg-white"
            >
              <DocumentIcon class="h-6 w-6 flex-shrink-0 text-gray-400" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ file.name }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ (file.size / 1024).toFixed(2) }} KB
                </p>
              </div>
              <button
                @click="removeFile(index)"
                type="button"
                class="p-1 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon class="h-5 w-5 text-gray-500" />
              </button>
            </li>
          </ul>
          <div
            v-else
            class="text-center py-10 px-4 rounded-lg bg-white border border-gray-200"
          >
            <p class="text-sm text-gray-500">No files staged for processing.</p>
          </div>
        </div>

        <div
          v-if="results.completionsFound > 0"
          class="mt-6 p-4 rounded-lg bg-green-50 border border-green-200"
        >
          <h3 class="text-base font-medium text-green-800">
            Batch Processing Complete
          </h3>
          <p class="mt-2 text-sm text-green-700">
            Successfully merged
            <span class="font-bold">{{ results.completionsFound }}</span> total
            training completions from the processed files.
          </p>
          <p class="text-sm text-green-700 mt-1">
            You can now view the updated reports.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useUiStore } from "@/stores/uiStore";
import { useProgressStore } from "@/stores/progressStore";
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

const uiStore = useUiStore();
const progressStore = useProgressStore();

const stagedFiles = ref<File[]>([]);
const results = reactive({ completionsFound: 0 });

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const files = event.dataTransfer?.files;
  if (files) addFilesToStage(Array.from(files));
};

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files) addFilesToStage(Array.from(files));
  if (fileInput.value) fileInput.value.value = "";
};

const addFilesToStage = (files: File[]) => {
  const validFiles = files.filter((file) => /\.(xlsx|xls)$/i.test(file.name));
  stagedFiles.value.push(...validFiles);
};

const removeFile = (indexToRemove: number) => {
  stagedFiles.value.splice(indexToRemove, 1);
};

const processStagedFiles = async () => {
  if (stagedFiles.value.length === 0) return;
  uiStore.setGlobalLoading(true);
  results.completionsFound = 0;

  const res = await progressStore.processAndMergeMultipleFiles(
    stagedFiles.value
  );
  results.completionsFound = res.completionsFound;

  if (res.completionsFound > 0) {
    uiStore.addNotification({
      message: "Training data successfully merged.",
      type: "success",
    });
  } else {
    uiStore.addNotification({
      message:
        "No new training completions were found in the provided file(s).",
      type: "warn",
    });
  }

  stagedFiles.value = []; // Clear the staging area
  uiStore.setGlobalLoading(false);
};
</script>
