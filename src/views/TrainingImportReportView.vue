<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="SHARP Import Report"
      subtitle="The following personnel records were updated by the file you just uploaded."
    >
      <template #actions>
        <router-link
          :to="{ name: 'TrainingUpload' }"
          class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <ArrowUpTrayIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span>Upload Another Report</span>
        </router-link>
      </template>
    </ActionHeader>

    <div v-if="hasResults" class="mt-4">
      <UpgraderReportTable :upgrader-ids="lastMergedUpgraderIds" />
    </div>
    <div v-else class="mt-8 text-center">
      <p class="text-gray-600">No import data to display.</p>
      <p class="mt-2 text-sm text-gray-500">
        This page shows the results of a SHARP file import. Please upload a file
        to see a report.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useProgressStore } from "@/stores/progressStore";
import ActionHeader from "@/components/ui/ActionHeader.vue";
import UpgraderReportTable from "@/components/specific/TrainingDataManager/UpgraderReportTable.vue";
import { ArrowUpTrayIcon } from "@heroicons/vue/24/outline";

const progressStore = useProgressStore();

// Use storeToRefs to get a reactive reference to the array of IDs
const { lastMergedUpgraderIds } = storeToRefs(progressStore);

// A computed property to check if there are any results to display
const hasResults = computed(
  () => lastMergedUpgraderIds.value && lastMergedUpgraderIds.value.length > 0
);
</script>
