<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Import Report</h2>
    <p class="text-sm text-gray-600 mb-4">
      The following {{ upgraders.length }} upgraders were updated from the last
      import.
    </p>
    <table
      class="min-w-full divide-y divide-gray-200 shadow border-b border-gray-200 sm:rounded-lg"
    >
      <thead class="bg-gray-50">
        <tr>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
          >
            Upgrader Name
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
          >
            Working Level
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
          >
            Progress
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
          >
            Pacing (vs. Deadline)
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
          >
            Projected Completion
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
          >
            Readiness
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr
          v-for="upgrader in upgraders"
          :key="upgrader.id"
          @click="viewStudentDetails(upgrader.id)"
          class="hover:bg-gray-100 cursor-pointer"
        >
          <td
            class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900"
          >
            {{ upgrader.displayName }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
            PQS {{ upgrader.derivedPqsWorkingLevel }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
            {{ upgrader.pqsProgressPercentage?.toFixed(0) ?? "N/A" }}%
          </td>
          <td
            class="px-4 py-3 whitespace-nowrap text-sm"
            :class="getPacingClass(upgrader.pacingAgainstDeadlineDays)"
          >
            {{ formatPacing(upgrader.pacingAgainstDeadlineDays) }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
            {{ formatUtcDateToDisplay(upgrader.projectedTotalCompletionDate) }}
          </td>
          <td
            class="px-4 py-3 whitespace-nowrap text-sm font-semibold"
            :class="getReadinessClass(upgrader.readinessAgainstDeadline)"
          >
            {{ upgrader.readinessAgainstDeadline }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, defineProps } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";
import { ReadinessStatus, Upgrader } from "@/types/personnelTypes";
import router from "@/router";

const props = defineProps({
  upgraderIds: { type: Array as PropType<string[]>, required: true },
});

const personnelStore = usePersonnelStore();

const upgraders = computed(() =>
  props.upgraderIds
    .map((id) => personnelStore.getPersonnelById(id))
    .filter((upgrader): upgrader is Upgrader => upgrader !== undefined)
);

const formatPacing = (pacing?: number) => {
  if (pacing == null) return "N/A";
  if (pacing > 0) return `${pacing} days ahead`;
  if (pacing < 0) return `${Math.abs(pacing)} days behind`;
  return "On track";
};

const getPacingClass = (pacing?: number) => {
  if (pacing == null) return "text-gray-600";
  if (pacing > 0) return "text-green-600";
  if (pacing < 0) return "text-red-600";
  return "text-gray-800";
};

const getReadinessClass = (status?: ReadinessStatus) => {
  if (!status) return "text-gray-500";
  const classes = {
    [ReadinessStatus.OnTrack]: "text-green-700",
    [ReadinessStatus.AtRisk]: "text-yellow-700",
    [ReadinessStatus.BehindSchedule]: "text-red-700",
    [ReadinessStatus.Blocked]: "text-red-900 font-bold",
    [ReadinessStatus.ReadyForNextLevel]: "text-blue-700",
    [ReadinessStatus.Unknown]: "text-gray-500",
  };
  return classes[status] || "text-gray-500";
};

const viewStudentDetails = (upgraderId: string) => {
  router.push({ name: "StudentDetail", params: { id: upgraderId } });
};
</script>
