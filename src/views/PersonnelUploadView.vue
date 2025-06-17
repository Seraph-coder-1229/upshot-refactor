<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="Personnel Roster Upload"
      subtitle="Upload an Excel file with your personnel data. Use the template for the correct format."
    >
      <template #actions>
        <button
          @click="handleDownloadTemplate"
          type="button"
          class="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowDownTrayIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
          <span>Download Template</span>
        </button>
        <router-link
          :to="{ name: 'Personnel' }"
          class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <EyeIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span>View Current Roster</span>
        </router-link>
      </template>
    </ActionHeader>

    <div class="max-w-3xl mx-auto">
      <BaseFileUpload
        title="Upload Personnel File"
        description="Drag & drop or click to browse for an .xlsx file."
        accepted-file-types="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
        :on-file-process="handleFileProcessing"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useUiStore } from "@/stores/uiStore";
import {
  processPersonnelFile,
  downloadPersonnelTemplate,
} from "@/core/excelProcessorServices/personnelProcessorService";

import ActionHeader from "@/components/ui/ActionHeader.vue";
import BaseFileUpload from "@/components/ui/BaseFileUpload.vue";
import { ArrowDownTrayIcon, EyeIcon } from "@heroicons/vue/24/outline";

const router = useRouter();
const personnelStore = usePersonnelStore();
const uiStore = useUiStore();

const handleFileProcessing = async (file: File) => {
  uiStore.setGlobalLoading(true);
  try {
    const processedData = await processPersonnelFile(file);

    if (processedData.length > 0) {
      personnelStore.setPersonnel(processedData);
      uiStore.addNotification({
        message: `${processedData.length} personnel records successfully loaded.`,
        type: "success",
      });
      router.push({ name: "Personnel" });
    } else {
      uiStore.addNotification({
        message:
          "No valid records were found in the file. Please check the file format and headers.",
        type: "warning",
        duration: 8000,
      });
    }
  } catch (error: any) {
    uiStore.addNotification({
      message: `An error occurred during file processing: ${error.message}`,
      type: "error",
      duration: 8000,
    });
  } finally {
    uiStore.setGlobalLoading(false);
  }
};

const handleDownloadTemplate = () => {
  downloadPersonnelTemplate();
};
</script>
