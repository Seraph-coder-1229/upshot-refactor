<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="Syllabus Upload"
      subtitle="Upload an .XLSX syllabus definition file."
    >
      <template #actions>
        <router-link
          :to="{ name: 'SyllabusManagement' }"
          class="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowUturnLeftIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
          <span>Back to Syllabus List</span>
        </router-link>
      </template>
    </ActionHeader>

    <div class="max-w-3xl mx-auto">
      <BaseFileUpload
        title="Upload Syllabus File"
        description="Drag & drop or click to browse for an .xlsx file."
        accepted-file-types="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
        :on-file-process="handleFileProcessing"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";
import { excelSyllabusProcessorService } from "@/core/excelProcessorServices/syllabusProcessorService";

import ActionHeader from "@/components/ui/ActionHeader.vue";
import BaseFileUpload from "@/components/ui/BaseFileUpload.vue";
import { ArrowUturnLeftIcon } from "@heroicons/vue/24/outline";

const router = useRouter();
const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();

const handleFileProcessing = async (file: File) => {
  uiStore.setGlobalLoading(true);
  try {
    const processedSyllabi = await excelSyllabusProcessorService(file);

    if (processedSyllabi && processedSyllabi.length > 0) {
      // Get the first syllabus from the array
      const newSyllabus = processedSyllabi[0];

      // Use our new, robust action
      syllabiStore.addSyllabus(newSyllabus);

      uiStore.addNotification({
        message: `Syllabus "${newSyllabus.name}" successfully loaded.`,
        type: "success",
      });
      router.push({ name: "SyllabusManagement" });
    } else {
      uiStore.addNotification({
        message: "Could not process syllabus. Check file for errors.",
        type: "warning",
        duration: 5000,
      });
    }
  } catch (error: any) {
    uiStore.addNotification({
      message: `An error occurred: ${error.message}`,
      type: "error",
    });
  } finally {
    uiStore.setGlobalLoading(false);
  }
};
</script>
