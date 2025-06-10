<template>
  <div
    v-if="report"
    class="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
  >
    <div class="p-6">
      <h2 class="text-xl font-bold text-gray-800">
        Track Report for {{ report.position }} {{ report.year }}
      </h2>
    </div>

    <div
      class="border-t border-gray-200 px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center"
    ></div>

    <div class="p-6 border-t border-gray-200">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">
        Track Progress Charts
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrackLevelChart
          v-if="level300Pqs.length > 0"
          :upgraders="level300Pqs"
          :level="'300'"
          :chart-type="RequirementType.PQS"
        />
        <TrackLevelChart
          v-if="level300Events.length > 0"
          :upgraders="level300Events"
          :level="'300'"
          :chart-type="RequirementType.Event"
        />
        <TrackLevelChart
          v-if="level200Pqs.length > 0"
          :upgraders="level200Pqs"
          :level="'200'"
          :chart-type="RequirementType.PQS"
        />
        <TrackLevelChart
          v-if="level200Events.length > 0"
          :upgraders="level200Events"
          :level="'200'"
          :chart-type="RequirementType.Event"
        />
      </div>
    </div>

    <div class="p-6 border-t border-gray-200">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">
        Upgrader Watch List (Sorted by Priority)
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200"></table>
      </div>
    </div>
  </div>
  <div v-else class="text-center p-8 bg-white rounded-lg shadow">
    <p>Generating report...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineProps } from "vue";
import { generateTrackReport } from "@/core/reportGeneratorService";
import type { TrackReport } from "@/types/reportTypes";
import { ReadinessStatus } from "@/types/personnelTypes";
import { RequirementType } from "@/types/syllabiTypes";
import TrackLevelChart from "../charts/TrackLevelChart.vue"; // <-- IMPORT NEW COMPONENT

const props = defineProps<{
  position: string;
  year: string;
}>();

const report = ref<TrackReport | null>(null);

onMounted(() => {
  report.value = generateTrackReport(props.position, props.year);
});

// ** NEW: Computed properties to filter students for each chart **
const level200Pqs = computed(() => {
  return (
    report.value?.prioritizedUpgraders.filter(
      (u) => u.derivedPqsWorkingLevel === "200"
    ) || []
  );
});
const level200Events = computed(() => {
  return (
    report.value?.prioritizedUpgraders.filter(
      (u) => u.derivedEventsWorkingLevel === "200"
    ) || []
  );
});
const level300Pqs = computed(() => {
  return (
    report.value?.prioritizedUpgraders.filter(
      (u) => u.derivedPqsWorkingLevel === "300"
    ) || []
  );
});
const level300Events = computed(() => {
  return (
    report.value?.prioritizedUpgraders.filter(
      (u) => u.derivedEventsWorkingLevel === "300"
    ) || []
  );
});

const readinessColorClass = (status: ReadinessStatus) => {
  switch (status) {
    case ReadinessStatus.OnTrack:
      return "text-green-700";
    case ReadinessStatus.AtRisk:
      return "text-yellow-600";
    case ReadinessStatus.BehindSchedule:
      return "text-red-700";
    case ReadinessStatus.Blocked:
      return "text-red-800 font-bold";
    default:
      return "text-gray-600";
  }
};
</script>
