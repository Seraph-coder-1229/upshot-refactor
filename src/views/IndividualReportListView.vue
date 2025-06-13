<!-- src/views/IndividualReportListView.vue -->
<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8">
    <!-- Header -->
    <div class="border-b border-gray-200 pb-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Individual Reports</h1>
          <p class="mt-2 max-w-4xl text-sm text-gray-500">
            Select a student to view their detailed progress report. Status and
            overall progress are shown for a quick overview.
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

    <!-- Search Input -->
    <div class="mt-6 max-w-md">
      <label for="search" class="sr-only">Search</label>
      <div class="relative rounded-md shadow-sm">
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
        >
          <MagnifyingGlassIcon
            class="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </div>
        <input
          v-model="searchTerm"
          type="search"
          name="search"
          id="search"
          class="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="Search by name..."
        />
      </div>
    </div>

    <!-- Personnel Grid -->
    <div class="mt-6">
      <ul
        role="list"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <li
          v-for="person in filteredPersonnel"
          :key="person.id"
          class="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <router-link
            :to="{ name: 'StudentDetail', params: { id: person.id.trim() } }"
            class="block h-full"
          >
            <div class="flex w-full items-center justify-between space-x-6 p-6">
              <div class="flex-1 truncate">
                <div class="flex items-center space-x-3">
                  <h3 class="truncate text-sm font-medium text-gray-900">
                    {{ person.displayName }}
                  </h3>
                  <span :class="getStatusBadge(person).class">{{
                    getStatusBadge(person).text
                  }}</span>
                </div>
                <p class="mt-1 truncate text-sm text-gray-500">
                  {{ person.assignedPosition }} -
                  {{ person.assignedSyllabusYear }}
                </p>
              </div>
              <!-- NEW: Progress Wheel -->
              <ProgressWheel :progress="getOverallProgress(person)" />
            </div>
            <div>
              <div class="-mt-px flex divide-x divide-gray-200">
                <div class="flex w-0 flex-1">
                  <div
                    class="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                  >
                    <ChartBarIcon
                      class="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    View Detailed Report
                  </div>
                </div>
              </div>
            </div>
          </router-link>
        </li>
      </ul>
      <div v-if="filteredPersonnel.length === 0" class="text-center mt-10">
        <p class="text-gray-500">No personnel found matching your search.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { ChartBarIcon, MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
import { ReadinessStatus, type Upgrader } from "@/types/personnelTypes";
import ProgressWheel from "@/components/ui/ProgressWheel.vue"; // Import the new component

const personnelStore = usePersonnelStore();
const searchTerm = ref("");

const getStatusBadge = (person: Upgrader) => {
  const status = person.readinessAgainstDeadline;
  switch (status) {
    case ReadinessStatus.OnTrack:
      return {
        text: "On Track",
        class:
          "inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20",
      };
    case ReadinessStatus.AtRisk:
      return {
        text: "At Risk",
        class:
          "inline-flex shrink-0 items-center rounded-full bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
      };
    case ReadinessStatus.BehindSchedule:
      return {
        text: "Behind",
        class:
          "inline-flex shrink-0 items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10",
      };
    case ReadinessStatus.Blocked:
      return {
        text: "Blocked",
        class:
          "inline-flex shrink-0 items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10",
      };
    case ReadinessStatus.ReadyForNextLevel:
      return {
        text: "Next Level Ready",
        class:
          "inline-flex shrink-0 items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10",
      };
    default:
      return {
        text: "Unknown",
        class:
          "inline-flex shrink-0 items-center rounded-full bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10",
      };
  }
};

const getOverallProgress = (person: Upgrader) => {
  const pqs = person.pqsProgressPercentage || 0;
  const events = person.eventsProgressPercentage || 0;
  // A simple average for an overall metric.
  return (pqs + events) / 2;
};

const filteredPersonnel = computed(() => {
  const allPersonnel = personnelStore.allPersonnelSortedByName;
  if (!searchTerm.value) {
    return allPersonnel;
  }
  return allPersonnel.filter((person) =>
    person.displayName.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});
</script>
