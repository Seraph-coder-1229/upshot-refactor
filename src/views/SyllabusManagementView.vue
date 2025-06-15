<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Syllabus Management</h1>
        <p class="text-gray-600">
          Manage existing syllabi or upload a new one.
        </p>
      </div>
      <button
        @click="handleDownloadSyllabi"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        :disabled="!syllabiStore.isDirty"
        title="Download all current syllabi as a user_syllabi.js file"
      >
        Download Syllabi
      </button>
    </header>

    <div
      class="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
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
        <p class="text-gray-500">
          Drag & drop your SHARP syllabus export here, or click to select a
          file.
        </p>
      </div>
    </div>

    <SyllabusList :syllabi="allSyllabi" @edit="handleEditExistingSyllabus" />

    <SyllabusUploadConfirmation
      v-if="pendingSyllabus"
      :is-open="isConfirmationModalOpen"
      :syllabus="pendingSyllabus"
      @accept="handleAcceptSyllabus"
      @edit="handleEditPendingSyllabus"
      @deny="handleDenySyllabus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";
import { excelSyllabusProcessorService } from "@/core/excelProcessorServices/syllabusProcessorService";
import SyllabusList from "@/components/specific/SyllabusManager/SyllabusList.vue";
import SyllabusUploadConfirmation from "@/components/specific/SyllabusManager/SyllabusUploadConfirmation.vue";
import type { Syllabus } from "@/types/syllabiTypes";
import { fileHandlerService } from "@/core/fileHandlerService";

const router = useRouter();
const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();
const allSyllabi = computed(() => syllabiStore.allSyllabi);

const isConfirmationModalOpen = ref(false);
const pendingSyllabus = ref<Syllabus | null>(null);
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
  uiStore.setGlobalLoading(true);
  try {
    const parsedSyllabiArray = await excelSyllabusProcessorService(file);
    if (parsedSyllabiArray && parsedSyllabiArray.length > 0) {
      const newSyllabus = parsedSyllabiArray[0];
      if (newSyllabus && newSyllabus.id) {
        pendingSyllabus.value = newSyllabus;
        isConfirmationModalOpen.value = true;
      } else {
        throw new Error("Parsed syllabus is malformed or missing an ID.");
      }
    } else {
      throw new Error("No syllabi could be parsed from the file.");
    }
  } catch (error: any) {
    console.error("Error during syllabus processing:", error);
    uiStore.addNotification({
      message: `Error parsing syllabus: ${error.message}`,
      type: "error",
    });
  } finally {
    uiStore.setGlobalLoading(false);
    if (fileInput.value) fileInput.value.value = "";
  }
};

// --- CORRECTED LOGIC ---
const handleAcceptSyllabus = () => {
  if (pendingSyllabus.value) {
    syllabiStore.addSyllabus(pendingSyllabus.value);
  }
  resetFlow();
};

const handleEditPendingSyllabus = () => {
  if (pendingSyllabus.value && pendingSyllabus.value.id) {
    // 1. Add the syllabus to the store IMMEDIATELY.
    syllabiStore.addSyllabus(pendingSyllabus.value);
    // 2. THEN, navigate. The syllabus is guaranteed to be in the store.
    router.push({
      name: "SyllabusEdit",
      params: { id: pendingSyllabus.value.id },
    });
  }
  resetFlow();
};
// --- END OF CORRECTION ---

const handleEditExistingSyllabus = (syllabusId: string) => {
  router.push({ name: "SyllabusEdit", params: { id: syllabusId } });
};

const handleDenySyllabus = () => {
  resetFlow();
};
const resetFlow = () => {
  isConfirmationModalOpen.value = false;
  pendingSyllabus.value = null;
};
const handleDownloadSyllabi = () => {
  fileHandlerService.downloadSyllabi(syllabiStore.allSyllabi);
};
</script>
