<template>
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
        Drag & drop your syllabus Excel file here, or click to select a file.
      </p>
      <p class="text-xs text-gray-400">Supports .xlsx and .xls formats</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from "vue";
import { useUiStore } from "@/stores/uiStore";
import { excelSyllabusProcessorService } from "@/core/excelProcessorServices/syllabusProcessorService";
import type { Syllabus } from "@/types/syllabiTypes";

const emit = defineEmits<{
  (e: "syllabus-parsed", syllabus: Syllabus): void;
}>();

const uiStore = useUiStore();
const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  if (event.dataTransfer?.files) {
    processFile(event.dataTransfer.files[0]);
  }
};

const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    processFile(target.files[0]);
  }
};

const processFile = async (file: File) => {
  if (!file) return;

  uiStore.setLoading(true);
  try {
    const newSyllabus = await excelSyllabusProcessorService(file);
    emit("syllabus-parsed", newSyllabus);
  } catch (error: any) {
    uiStore.addNotification({
      message: `Error parsing syllabus: ${error.message}`,
      type: "error",
    });
    console.error(error);
  } finally {
    uiStore.setLoading(false);
  }
};
</script>
