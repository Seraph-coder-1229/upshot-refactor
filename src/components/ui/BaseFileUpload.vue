<template>
  <div
    class="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg text-center"
    :class="{
      'border-blue-500 bg-blue-50': isDragging,
      'border-gray-300 hover:border-blue-400': !isDragging && !isLoading,
      'cursor-pointer': !isLoading,
      'cursor-wait': isLoading,
    }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10"
    >
      <div class="text-lg font-semibold text-gray-700">Processing...</div>
    </div>

    <input
      type="file"
      ref="fileInput"
      :accept="acceptedFileTypes"
      class="hidden"
      @change="handleInputChange"
      :disabled="isLoading"
    />

    <h3 class="text-xl font-semibold text-gray-800">{{ title }}</h3>
    <p class="mt-2 text-sm text-gray-500">{{ description }}</p>
    <p class="mt-1 text-xs text-gray-400">Drag & drop or click to upload</p>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from "vue";
import { loggingService } from "@/utils/loggingService";

const props = defineProps<{
  title: string;
  description: string;
  acceptedFileTypes: string;
  onFileProcess: (file: File) => Promise<void>;
}>();

const isLoading = ref(false);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const processFile = async (file: File | undefined | null) => {
  if (!file) return;

  // Basic type check
  if (
    !props.acceptedFileTypes.includes(file.type) &&
    props.acceptedFileTypes !== "*"
  ) {
    loggingService.logWarn(
      `Unsupported file type: ${file.type}. Accepted types: ${props.acceptedFileTypes}`
    );
    return;
  }

  isLoading.value = true;
  isDragging.value = false;
  try {
    await props.onFileProcess(file);
  } catch (error) {
    loggingService.logError(`Error processing file: ${file.name}`, error);
  } finally {
    isLoading.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  if (isLoading.value) return;
  const file = event.dataTransfer?.files[0];
  processFile(file);
};

const handleInputChange = (event: Event) => {
  if (isLoading.value) return;
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  processFile(file);
};

const triggerFileInput = () => {
  if (isLoading.value) return;
  fileInput.value?.click();
};

const onDragOver = () => {
  if (isLoading.value) return;
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};
</script>
