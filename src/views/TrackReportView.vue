<template>
  <div class="p-4 lg:p-6 space-y-6 report-container">
    <div class="flex justify-between items-center non-printable">
      <div class="flex items-center gap-4">
        <router-link
          to="/reports"
          class="flex items-center gap-1 text-sm p-2 rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          Back
        </router-link>
        <h1 class="text-2xl font-bold">Track Report</h1>
      </div>
      <button
        @click="printReport"
        class="p-2 rounded-full hover:bg-gray-200"
        title="Print Report"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
      </button>
    </div>

    <div class="p-4 bg-gray-100 rounded-lg shadow-sm non-printable">
      <label
        for="position-select"
        class="block text-sm font-medium text-gray-700"
        >Track/Position</label
      >
      <select
        id="position-select"
        v-model="selectedPosition"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option v-for="pos in availablePositions" :key="pos" :value="pos">
          {{ pos }}
        </option>
      </select>
    </div>

    <div v-if="filteredUpgraders.length > 0" class="printable-content">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div
          class="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2"
        >
          <div class="bg-blue-100 p-2 rounded-full">
            <svg
              class="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-xl font-bold">{{ healthSummary.total }}</p>
            <p class="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div
          class="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2"
        >
          <div class="bg-red-100 p-2 rounded-full">
            <svg
              class="h-5 w-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
          </div>
          <div>
            <p class="text-xl font-bold">{{ healthSummary.behind }}</p>
            <p class="text-xs text-gray-500">Behind</p>
          </div>
        </div>
        <div
          class="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2"
        >
          <div class="bg-yellow-100 p-2 rounded-full">
            <svg
              class="h-5 w-5 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p class="text-xl font-bold">{{ healthSummary.atRisk }}</p>
            <p class="text-xs text-gray-500">At Risk</p>
          </div>
        </div>
        <div
          class="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2"
        >
          <div class="bg-purple-100 p-2 rounded-full">
            <svg
              class="h-5 w-5 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"
              />
            </svg>
          </div>
          <div>
            <p class="text-xl font-bold">{{ healthSummary.readyForNext }}</p>
            <p class="text-xs text-gray-500">Next Level</p>
          </div>
        </div>
        <div
          class="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2"
        >
          <div class="bg-gray-200 p-2 rounded-full">
            <svg
              class="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div>
            <p class="text-xl font-bold">{{ healthSummary.blocked }}</p>
            <p class="text-xs text-gray-500">Blocked</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <div class="p-4 bg-white rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold mb-3">Top Priority Students</h2>
            <ul v-if="priorityUpgraders.length > 0" class="space-y-2">
              <li
                v-for="upgrader in priorityUpgraders"
                :key="upgrader.id"
                class="flex justify-between items-center p-2 rounded-md"
                :class="getReadinessClass(upgrader.readinessAgainstDeadline!)"
              >
                <span class="font-medium text-sm">{{
                  upgrader.displayName
                }}</span>
                <span class="text-xs font-semibold">{{
                  getPacingText(upgrader.pacingAgainstDeadlineDays)
                }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-gray-500">
              All students are on track.
            </p>
          </div>
        </div>
        <div class="lg:col-span-2 space-y-8">
          <div v-for="level in uniqueLevels" :key="level">
            <h2 class="text-xl font-semibold">Level {{ level }} Progress</h2>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-2">
              <TrackLevelChart
                :upgraders="getUpgradersForLevel(level)"
                :level="String(level)"
                :chart-type="RequirementType.PQS"
              />
              <TrackLevelChart
                :upgraders="getUpgradersForLevel(level)"
                :level="String(level)"
                :chart-type="RequirementType.Event"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-center p-8 text-gray-500 bg-white rounded-lg shadow-sm"
    >
      <p class="text-lg font-medium">
        No upgraders match the selected criteria.
      </p>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .printable-content,
  .printable-content * {
    visibility: visible;
  }
  .printable-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .non-printable {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { ref, computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useSyllabiStore } from "@/stores/syllabiStore";
import TrackLevelChart from "@/components/specific/charts/TrackLevelChart.vue";
import { RequirementType } from "@/types/syllabiTypes";
import { type Upgrader, ReadinessStatus } from "@/types/personnelTypes";
import * as trainingLogicService from "@/core/trainingLogicService";

const personnelStore = usePersonnelStore();
const syllabiStore = useSyllabiStore();

const availablePositions = computed(() =>
  Array.from(
    new Set(personnelStore.allPersonnel.map((u) => u.assignedPosition))
  )
);
const selectedPosition = ref(
  availablePositions.value.length > 0 ? availablePositions.value[0] : ""
);

const filteredUpgraders = computed(() => {
  return personnelStore.allPersonnel.filter((upgrader) => {
    if (upgrader.assignedPosition !== selectedPosition.value) return false;
    if (!upgrader.rawCompletions?.length) return false;
    const currentLevel = parseInt(upgrader.derivedPqsWorkingLevel || "0");
    return currentLevel > 0;
  });
});

const healthSummary = computed(() => {
  return filteredUpgraders.value.reduce(
    (acc, upgrader) => {
      acc.total++;
      switch (upgrader.readinessAgainstDeadline) {
        case ReadinessStatus.Blocked:
          acc.blocked++;
          break;
        case ReadinessStatus.BehindSchedule:
          acc.behind++;
          break;
        case ReadinessStatus.AtRisk:
          acc.atRisk++;
          break;
        case ReadinessStatus.ReadyForNextLevel:
          acc.readyForNext++;
          break;
      }
      return acc;
    },
    { total: 0, blocked: 0, behind: 0, atRisk: 0, readyForNext: 0 }
  );
});

const priorityUpgraders = computed(() => {
  if (!filteredUpgraders.value.length) return [];
  const syllabus = syllabiStore.findSyllabus(
    filteredUpgraders.value[0].assignedPosition,
    filteredUpgraders.value[0].assignedSyllabusYear
  );
  if (!syllabus) return [];
  return trainingLogicService
    .getPrioritizedUpgraders(filteredUpgraders.value, syllabus)
    .slice(0, 3);
});

const uniqueLevels = computed(() => {
  const levels = new Set(
    filteredUpgraders.value
      .map((u) => parseInt(u.derivedPqsWorkingLevel || "0"))
      .filter((l) => l > 0)
  );
  return Array.from(levels).sort((a, b) => a - b);
});

const getUpgradersForLevel = (level: number): Upgrader[] => {
  return filteredUpgraders.value.filter(
    (u) => parseInt(u.derivedPqsWorkingLevel || "0") === level
  );
};

const getReadinessClass = (status: ReadinessStatus) => {
  const classes = {
    [ReadinessStatus.Blocked]: "bg-gray-200 text-gray-800",
    [ReadinessStatus.BehindSchedule]: "bg-red-200 text-red-800",
    [ReadinessStatus.AtRisk]: "bg-yellow-200 text-yellow-800",
    [ReadinessStatus.ReadyForNextLevel]: "bg-purple-200 text-purple-800",
    [ReadinessStatus.OnTrack]: "bg-green-200 text-green-800",
  };
  return classes[status] || "bg-green-200 text-green-800";
};

const getPacingText = (pacing?: number) => {
  if (pacing === undefined || pacing === null) return "N/A";
  if (pacing >= 0) return `${pacing}d Ahead`;
  return `${Math.abs(pacing)}d Behind`;
};

const printReport = () => {
  window.print();
};
</script>
