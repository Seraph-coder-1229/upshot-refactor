<template>
  <div class="p-4 sm:p-6 lg:p-8 report-container">
    <div class="sm:flex sm:items-center sm:justify-between non-printable">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Monthly Training Summary
        </h1>
        <p v-if="reportData" class="mt-2 text-sm text-gray-700">
          Showing training activity from
          {{ formatDate(reportData.startDate) }} to
          {{ formatDate(reportData.reportDate) }}.
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
          @click="printReport"
          class="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <svg
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5 2.5a2.5 2.5 0 00-2.5 2.5v9a2.5 2.5 0 002.5 2.5h10a2.5 2.5 0 002.5-2.5v-9a2.5 2.5 0 00-2.5-2.5H5zM6 5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7A.5.5 0 016 5zm0 2.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 2.5a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5z"
              clip-rule="evenodd"
            />
          </svg>
          Print Report
        </button>
      </div>
    </div>

    <div
      v-if="reportData && reportData.trackSummaries.length > 0"
      class="mt-8 printable-content"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="track in reportData.trackSummaries"
          :key="track.trackName"
          class="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 class="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
            {{ track.trackName }}
          </h2>
          <div class="space-y-4">
            <div class="flex justify-between items-baseline">
              <span class="text-sm font-medium text-gray-600"
                >Students Enrolled:</span
              >
              <span class="text-lg font-bold text-gray-900">{{
                track.totalEnrolled
              }}</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm font-medium text-gray-600"
                >Students Behind:</span
              >
              <span
                class="text-lg font-bold"
                :class="
                  track.numberBehind > 0 ? 'text-red-600' : 'text-gray-900'
                "
              >
                {{ track.numberBehind }}
              </span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm font-medium text-gray-600"
                >Events Completed (Month):</span
              >
              <span class="text-lg font-bold text-gray-900">{{
                track.eventsCompletedThisMonth
              }}</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm font-medium text-gray-600"
                >PQS Completed (Month):</span
              >
              <span class="text-lg font-bold text-gray-900">{{
                track.pqsCompletedThisMonth
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="mt-8 text-center py-12 px-6 bg-white rounded-lg shadow-sm"
    >
      <h3 class="text-lg font-medium text-gray-900">
        No Training Data Available
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        There is no monthly training data to display. Please ensure personnel
        have assigned tracks and recent completions.
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
    padding: 2rem;
  }
  .non-printable {
    display: none;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { generateMonthlyReport } from "@/core/reportGeneratorService";
import type { MonthlyReportData } from "@/types/reportTypes";

const reportData = ref<MonthlyReportData | null>(null);

onMounted(() => {
  reportData.value = generateMonthlyReport();
});

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const printReport = () => {
  window.print();
};
</script>
