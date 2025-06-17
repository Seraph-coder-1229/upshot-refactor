<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="Training Data Management"
      subtitle="Upload SHARP reports to update trainee progress."
    >
      <template #actions>
        <router-link
          :to="{ name: 'TrainingUpload' }"
          class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <ArrowUpTrayIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span>Upload SHARP Report</span>
        </router-link>
      </template>
    </ActionHeader>

    <div class="mt-4">
      <h2 class="text-lg font-medium text-gray-900">Upgrader Status</h2>
      <p class="mt-1 text-sm text-gray-500">
        This table shows the completion status for all personnel identified as
        'Upgraders'.
      </p>
      <UpgraderReportTable class="mt-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ActionHeader from "@/components/ui/ActionHeader.vue";
import UpgraderReportTable from "@/components/specific/TrainingDataManager/UpgraderReportTable.vue";
import { ArrowUpTrayIcon } from "@heroicons/vue/24/outline";
import { usePersonnelStore } from "@/stores/personnelStore";
import { computed } from "vue";
const personnelStore = usePersonnelStore();
const upgraderIds = computed(() =>
  personnelStore.allPersonnel
    .filter((p) => p.isUpgrader) // Assuming an 'isUpgrader' flag, adjust if needed
    .map((p) => p.id)
);
</script>
