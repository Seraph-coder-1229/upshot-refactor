<!-- src/views/TrackReportView.vue -->
<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8">
    <!-- Header -->
    <div class="border-b border-gray-200 pb-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Track-Level Reports</h1>
          <p class="mt-2 max-w-4xl text-sm text-gray-500">
            Use the filters below to generate a comparative report for all
            students on a specific track and qualification level.
          </p>
        </div>
        <router-link
          to="/reports"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          &larr; Back to Reports Dashboard
        </router-link>
      </div>
    </div>

    <!-- Filters Section -->
    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 shadow-sm"
    >
      <div>
        <label
          for="position-select"
          class="block text-sm font-medium text-gray-700"
          >Position</label
        >
        <select
          id="position-select"
          v-model="selectedPosition"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option :value="null" disabled>Select a position</option>
          <option v-for="pos in availablePositions" :key="pos" :value="pos">
            {{ pos }}
          </option>
        </select>
      </div>

      <div>
        <label for="year-select" class="block text-sm font-medium text-gray-700"
          >Syllabus Year</label
        >
        <select
          id="year-select"
          v-model="selectedYear"
          :disabled="!selectedPosition"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option :value="null" disabled>Select a year</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div>
        <label
          for="level-select"
          class="block text-sm font-medium text-gray-700"
          >Report Level</label
        >
        <select
          id="level-select"
          v-model="selectedLevel"
          :disabled="!selectedSyllabus"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option :value="null" disabled>Select a level</option>
          <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">
            {{ lvl }}
          </option>
        </select>
      </div>
    </div>

    <!-- Report Display Section -->
    <div v-if="shouldDisplayReport" class="mt-4">
      <TrackReport
        :upgraders="filteredUpgraders"
        :level="selectedLevel!"
        :position="selectedPosition!"
        :year="selectedYear!"
        :key="reportKey"
      />
    </div>
    <div v-else class="mt-6 text-center text-gray-500 py-12">
      <p>Please select a position, year, and level to generate a report.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useSyllabiStore } from "@/stores/syllabiStore";
import TrackReport from "@/components/specific/reports/TrackReport.vue";

const personnelStore = usePersonnelStore();
const syllabiStore = useSyllabiStore();

// State for user selections
const selectedPosition = ref<string | null>(null);
const selectedYear = ref<string | null>(null);
const selectedLevel = ref<string | null>(null);

// Watch for changes to reset dependent dropdowns
watch(selectedPosition, () => {
  selectedYear.value = null;
  selectedLevel.value = null;
});

watch(selectedYear, () => {
  selectedLevel.value = null;
});

// Computed properties for populating dropdowns
const availablePositions = computed(() => syllabiStore.getAvailablePositions);
const availableYears = computed(() => {
  if (!selectedPosition.value) return [];
  return syllabiStore.getAvailableYearsForPosition(selectedPosition.value);
});
const selectedSyllabus = computed(() => {
  if (!selectedPosition.value || !selectedYear.value) return undefined;
  return syllabiStore.findSyllabus(selectedPosition.value, selectedYear.value);
});
const availableLevels = computed(() => {
  if (!selectedSyllabus.value) return [];
  return syllabiStore.getAvailableLevels(
    selectedSyllabus.value.position,
    selectedSyllabus.value.year
  );
});

// Computed property to filter personnel based on selections
const filteredUpgraders = computed(() => {
  if (!selectedPosition.value || !selectedYear.value) return [];
  return personnelStore.allPersonnel.filter(
    (p) =>
      p.assignedPosition === selectedPosition.value &&
      p.assignedSyllabusYear === selectedYear.value
  );
});

// Computed property to control report rendering
const shouldDisplayReport = computed(() => {
  return (
    selectedPosition.value &&
    selectedYear.value &&
    selectedLevel.value &&
    filteredUpgraders.value.length > 0
  );
});

// Key for re-rendering the report when selections change
const reportKey = computed(
  () => `${selectedPosition.value}-${selectedYear.value}-${selectedLevel.value}`
);
</script>
