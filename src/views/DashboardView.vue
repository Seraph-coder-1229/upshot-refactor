<!-- src/views/DashboardView.vue -->
<template>
  <div class="p-8 bg-gray-50 min-h-full">
    <h1 class="text-3xl font-bold text-gray-900">Welcome to UPSHOT</h1>
    <p class="mt-2 text-lg text-gray-600">
      Follow the steps below to get your training data processed and view your
      reports.
    </p>

    <div class="mt-8">
      <ul class="space-y-4">
        <!-- Step 1: Load Personnel -->
        <li class="flex items-start">
          <div class="flex-shrink-0">
            <CheckCircleIcon
              v-if="isPersonnelLoaded"
              class="h-8 w-8 text-green-500"
            />
            <div
              v-else
              class="h-8 w-8 flex items-center justify-center border-2 border-blue-500 rounded-full"
            >
              <span class="text-blue-500 font-bold">1</span>
            </div>
          </div>
          <div class="ml-4">
            <h2 class="text-lg font-medium text-gray-900">
              Load Personnel Data
            </h2>
            <p class="text-gray-500">
              Import your squadron's roster from an approved Excel file.
            </p>
            <router-link
              to="/personnel-upload"
              class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UsersIcon class="h-5 w-5 mr-2" />
              {{
                isPersonnelLoaded ? "Reload Personnel" : "Load Personnel File"
              }}
            </router-link>
          </div>
        </li>

        <!-- Step 2: Load Training Data -->
        <li class="flex items-start">
          <div class="flex-shrink-0">
            <CheckCircleIcon
              v-if="isTrainingDataMerged"
              class="h-8 w-8 text-green-500"
            />
            <div
              v-else
              :class="[
                'h-8 w-8 flex items-center justify-center border-2 rounded-full',
                !isPersonnelLoaded ? 'border-gray-300' : 'border-blue-500',
              ]"
            >
              <span
                :class="[
                  'font-bold',
                  !isPersonnelLoaded ? 'text-gray-300' : 'text-blue-500',
                ]"
                >2</span
              >
            </div>
          </div>
          <div class="ml-4">
            <h2
              :class="[
                'text-lg font-medium',
                !isPersonnelLoaded ? 'text-gray-400' : 'text-gray-900',
              ]"
            >
              Load Training Data
            </h2>
            <p
              :class="[!isPersonnelLoaded ? 'text-gray-400' : 'text-gray-500']"
            >
              Import one or more SHARP export files to merge training
              completions.
            </p>
            <router-link
              to="/training-upload"
              :class="[
                'mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm',
                !isPersonnelLoaded
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
              ]"
              :is="isPersonnelLoaded ? 'router-link' : 'span'"
            >
              <DocumentArrowUpIcon class="h-5 w-5 mr-2" />
              {{
                isTrainingDataMerged
                  ? "Load More Training Data"
                  : "Load Training File(s)"
              }}
            </router-link>
          </div>
        </li>

        <!-- Step 3: View Reports -->
        <li class="flex items-start">
          <div class="flex-shrink-0">
            <div
              :class="[
                'h-8 w-8 flex items-center justify-center border-2 rounded-full',
                !isAllDataLoaded ? 'border-gray-300' : 'border-blue-500',
              ]"
            >
              <span
                :class="[
                  'font-bold',
                  !isAllDataLoaded ? 'text-gray-300' : 'text-blue-500',
                ]"
                >3</span
              >
            </div>
          </div>
          <div class="ml-4">
            <h2
              :class="[
                'text-lg font-medium',
                !isAllDataLoaded ? 'text-gray-400' : 'text-gray-900',
              ]"
            >
              Analyze & Report
            </h2>
            <p :class="[!isAllDataLoaded ? 'text-gray-400' : 'text-gray-500']">
              View individual and track-level reports based on the loaded data.
            </p>
            <router-link
              to="/reports"
              :class="[
                'mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm',
                !isAllDataLoaded
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
              ]"
              :is="isAllDataLoaded ? 'router-link' : 'span'"
            >
              <ChartBarIcon class="h-5 w-5 mr-2" />
              View Reports
            </router-link>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useProgressStore } from "@/stores/progressStore";
import {
  CheckCircleIcon,
  UsersIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
} from "@heroicons/vue/24/solid";

const personnelStore = usePersonnelStore();
const progressStore = useProgressStore();

const isPersonnelLoaded = computed(() => personnelStore.isDataLoaded);
const isTrainingDataMerged = computed(
  () => progressStore.lastMergedUpgraderIds.length > 0
);
const isAllDataLoaded = computed(
  () => isPersonnelLoaded.value && isTrainingDataMerged.value
);
</script>
