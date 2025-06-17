<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Track Overview Report</h1>

    <div class="max-w-xs mb-8">
      <label
        for="track-selector"
        class="block text-sm font-medium text-gray-700"
        >Select Track</label
      >
      <select
        id="track-selector"
        v-model="selectedTrack"
        @change="loadReport"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option v-for="track in availableTracks" :key="track" :value="track">
          {{ track }}
        </option>
      </select>
    </div>

    <div v-if="isLoading" class="text-center p-12">
      <p class="text-lg text-gray-600">Generating report...</p>
    </div>

    <div v-if="report" class="space-y-8">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Next Month Priority Events
        </h3>
        <ul
          v-if="report.nextMonthPriorityEvents.length > 0"
          class="divide-y divide-gray-200"
        >
          <li
            v-for="event in report.nextMonthPriorityEvents"
            :key="event.id"
            class="py-3"
          >
            <p class="font-semibold text-gray-900">
              {{ event.displayName }} (L{{ event.level }})
            </p>
            <p class="text-sm text-gray-500">{{ event.type }}</p>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-500 italic mt-2">
          No priority events identified.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { generateTrackOverviewReport } from "@/core/reportGeneratorService";
import type { TrackOverview } from "@/types/reportTypes";
import { ReadinessStatus } from "@/types/personnelTypes";

const personnelStore = usePersonnelStore();
const availableTracks = ref<string[]>([]);
const selectedTrack = ref<string | null>(null);
const report = ref<TrackOverview | null>(null);
const isLoading = ref(false);

onMounted(() => {
  const tracks = new Set(
    personnelStore.allPersonnel.map((p) => p.assignedPosition)
  );
  availableTracks.value = Array.from(tracks);
  if (availableTracks.value.length > 0) {
    selectedTrack.value = availableTracks.value[0];
    loadReport();
  }
});

const loadReport = () => {
  if (selectedTrack.value) {
    isLoading.value = true;
    report.value = null;
    setTimeout(() => {
      report.value = generateTrackOverviewReport(selectedTrack.value!);
      isLoading.value = false;
    }, 50);
  }
};

const healthScoreColor = computed(() => {
  if (!report.value) return "text-gray-900";
  const score = report.value.trackHealthScore;
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
});

const getReadinessClass = (status?: ReadinessStatus) => {
  switch (status) {
    case ReadinessStatus.OnTrack:
      return "bg-green-100 text-green-800";
    case ReadinessStatus.AtRisk:
      return "bg-yellow-100 text-yellow-800";
    case ReadinessStatus.BehindSchedule:
      return "bg-red-100 text-red-800";
    case ReadinessStatus.Blocked:
      return "bg-gray-200 text-gray-800 font-bold";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
</script>
