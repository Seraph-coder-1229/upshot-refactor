<template>
  <div class="p-4 space-y-8">
    <header>
      <h1 class="text-2xl font-bold text-gray-800">Reports Dashboard</h1>
      <p class="text-gray-600">
        Generate reports for individuals, entire tracks, or download anonymized
        data for analysis.
      </p>
    </header>

    <div
      class="p-4 bg-white rounded-lg shadow-md border border-gray-200 space-y-4"
    >
      <h2 class="text-lg font-semibold text-gray-700">Report Controls</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label
            for="track-selector"
            class="block text-sm font-medium text-gray-700"
            >Select Track to View</label
          >
          <select
            id="track-selector"
            v-model="selectedTrackId"
            @change="selectedUpgraderId = null"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option :value="null">-- Select a Track --</option>
            <option
              v-for="track in availableTracks"
              :key="track.id"
              :value="track.id"
            >
              {{ track.position }} - {{ track.year }}
            </option>
          </select>
        </div>

        <div>
          <label
            for="upgrader-selector"
            class="block text-sm font-medium text-gray-700"
            >Select Individual to View</label
          >
          <select
            id="upgrader-selector"
            v-model="selectedUpgraderId"
            @change="selectedTrackId = null"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option :value="null">-- Select Personnel --</option>
            <option
              v-for="person in allPersonnel"
              :key="person.id"
              :value="person.id"
            >
              {{ person.displayName }}
            </option>
          </select>
        </div>

        <div>
          <button
            @click="handleDownloadLlmReport"
            class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download LLM Report (JSON)
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <IndividualReport
        v-if="selectedUpgraderId"
        :upgrader-id="selectedUpgraderId"
        :key="selectedUpgraderId"
      />
      <TrackReport
        v-else-if="selectedTrack"
        :position="selectedTrack.position"
        :year="selectedTrack.year"
        :key="selectedTrack.id"
      />
      <div
        v-else
        class="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <p class="text-gray-500">
          Select a track or an individual to generate a report.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { saveAs } from "file-saver";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { generateLLMMultiTrackMonthlyReport } from "@/core/reportGeneratorService";
import IndividualReport from "@/components/specific/reports/IndividualReport.vue";
import TrackReport from "@/components/specific/reports/TrackReport.vue";

const personnelStore = usePersonnelStore();
const syllabiStore = useSyllabiStore();

const selectedTrackId = ref<string | null>(null);
const selectedUpgraderId = ref<string | null>(null);

const allPersonnel = computed(() => personnelStore.allPersonnelSortedByName);
const availableTracks = computed(() =>
  syllabiStore.allSyllabi.map((s) => ({
    id: s.id,
    position: s.position,
    year: s.year,
  }))
);

const selectedTrack = computed(() => {
  if (!selectedTrackId.value) return null;
  return (
    availableTracks.value.find((t) => t.id === selectedTrackId.value) || null
  );
});

const handleDownloadLlmReport = async () => {
  const reportData = await generateLLMMultiTrackMonthlyReport();
  const jsonString = JSON.stringify(reportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  saveAs(blob, "llm_monthly_report.json");
};
</script>
