<template>
  <div class="p-6 bg-white rounded-lg shadow-md text-center">
    <h2 class="text-xl font-semibold text-gray-800">
      Process SHARP Training Data
    </h2>
    <p class="text-gray-600 mt-2">
      Upload a SHARP Training Data export file to merge completions and update
      personnel metrics.
    </p>
    <div class="mt-6">
      <button
        @click="triggerFileInput"
        class="px-6 py-3 border rounded-md text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
      >
        Upload SHARP File (.xlsx)
      </button>
      <input
        ref="fileInput"
        type="file"
        @change="handleFileSelected"
        class="hidden"
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useProgressStore } from "@/stores/progressStore";

const progressStore = useProgressStore();
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => fileInput.value?.click();

const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await progressStore.loadAndProcessSharpFile(file);
  }
  if (target) target.value = "";
};
</script>
