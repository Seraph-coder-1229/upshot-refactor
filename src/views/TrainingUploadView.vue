<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="SHARP Report Upload"
      subtitle="Upload an .XLSX training report exported from SHARP to update personnel progress."
    >
      <template #actions>
        <router-link
          :to="{ name: 'Dashboard' }"
          class="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowUturnLeftIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
          <span>Back to Data Management</span>
        </router-link>
      </template>
    </ActionHeader>

    <div class="max-w-3xl mx-auto">
      <BaseFileUpload
        title="Upload SHARP Report"
        description="Drag & drop or click to browse for an .xlsx file."
        accepted-file-types="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
        :on-file-process="handleFileProcessing"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from "vue-router";
import { useProgressStore } from "@/stores/progressStore";
import { useUiStore } from "@/stores/uiStore";
import ActionHeader from "@/components/ui/ActionHeader.vue";
import BaseFileUpload from "@/components/ui/BaseFileUpload.vue";
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/outline";

const router = useRouter();
const progressStore = useProgressStore();
const uiStore = useUiStore();

const handleFileProcessing = async (file: File) => {
  // Call the new, robust action in our refactored progress store
  const result = await progressStore.processAndApplySharpReport(file);

  if (result.success) {
    uiStore.addNotification({
      message: result.message || "SHARP report processed successfully.",
      type: "success",
    });
    // Redirect to the new Report page to show the user what changed.
    router.push({ name: "TrainingImportReport" });
  } else {
    uiStore.addNotification({
      message: result.message || "Failed to process SHARP report.",
      type: "error",
      duration: 8000,
    });
  }
};
</script>
