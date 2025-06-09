<template>
  <div class="container mx-auto py-4">
    <SharpFileUpload v-if="viewState === 'upload'" />

    <SharpFileConfirmation v-if="viewState === 'confirm'" />

    <div v-if="viewState === 'report'">
      <UpgraderReportTable
        :upgrader-ids="progressStore.lastMergedUpgraderIds"
      />
      <button
        @click="progressStore.cancelSharpDataMerge()"
        class="mt-4 px-4 py-2 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Process Another File
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useProgressStore } from "@/stores/progressStore";
import SharpFileUpload from "@/components/specific/TrainingDataManager/SharpFileUpload.vue";
import SharpFileConfirmation from "@/components/specific/TrainingDataManager/SharpFileConfirmation.vue";
import UpgraderReportTable from "@/components/specific/TrainingDataManager/UpgraderReportTable.vue";

const progressStore = useProgressStore();

// This computed property determines which state the view should be in.
const viewState = computed(() => {
  if (progressStore.pendingSharpData) {
    return "confirm";
  }
  if (progressStore.lastMergedUpgraderIds.length > 0) {
    return "report";
  }
  return "upload";
});
</script>
