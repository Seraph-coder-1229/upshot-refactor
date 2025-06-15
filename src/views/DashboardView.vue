<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-full">
    <div class="md:flex md:items-center md:justify-between">
      <div class="min-w-0 flex-1">
        <h1
          class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight"
        >
          Welcome to UPSHOT
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          Your squadron's training analysis and reporting dashboard.
        </p>
      </div>
    </div>

    <div class="mt-8">
      <div>
        <h2 class="text-lg font-medium text-gray-900">Getting Started</h2>
        <p class="mt-1 text-sm text-gray-500">
          Follow these steps to load your data and generate reports.
        </p>
        <div class="mt-4" aria-hidden="true">
          <div class="overflow-hidden rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full bg-indigo-600"
              :style="{ width: progressPercentage + '%' }"
            />
          </div>
          <div
            class="mt-2 hidden grid-cols-3 text-sm font-medium text-gray-600 sm:grid"
          >
            <div class="text-indigo-600">Load Personnel</div>
            <div
              :class="[
                isPersonnelLoaded ? 'text-indigo-600' : 'text-gray-500',
                'text-center',
              ]"
            >
              Load Training Data
            </div>
            <div
              :class="[
                isAllDataLoaded ? 'text-indigo-600' : 'text-gray-500',
                'text-right',
              ]"
            >
              Analyze & Report
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UsersIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt class="truncate text-sm font-medium text-gray-500">
                    Step 1
                  </dt>
                  <dd>
                    <div class="text-lg font-medium text-gray-900">
                      Load Personnel
                    </div>
                  </dd>
                </dl>
              </div>
              <div v-if="isPersonnelLoaded" class="flex-shrink-0">
                <span
                  class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                  >Complete</span
                >
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-5 py-3">
            <div class="text-sm">
              <router-link
                to="/personnel-upload"
                class="font-medium text-indigo-700 hover:text-indigo-900"
              >
                {{
                  isPersonnelLoaded
                    ? "View or Reload Roster"
                    : "Go to Personnel Upload"
                }}
                <span aria-hidden="true"> &rarr;</span>
              </router-link>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <DocumentArrowUpIcon
                  :class="[
                    'h-6 w-6',
                    isPersonnelLoaded ? 'text-gray-400' : 'text-gray-300',
                  ]"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt
                    :class="[
                      'truncate text-sm font-medium',
                      isPersonnelLoaded ? 'text-gray-500' : 'text-gray-400',
                    ]"
                  >
                    Step 2
                  </dt>
                  <dd>
                    <div
                      :class="[
                        'text-lg font-medium',
                        isPersonnelLoaded ? 'text-gray-900' : 'text-gray-500',
                      ]"
                    >
                      Load Training Data
                    </div>
                  </dd>
                </dl>
              </div>
              <div v-if="isTrainingDataMerged" class="flex-shrink-0">
                <span
                  class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                  >Complete</span
                >
              </div>
            </div>
          </div>
          <div
            :class="[
              'px-5 py-3',
              isPersonnelLoaded ? 'bg-gray-50' : 'bg-gray-200',
            ]"
          >
            <div class="text-sm">
              <router-link
                v-if="isPersonnelLoaded"
                to="/training-upload"
                class="font-medium text-indigo-700 hover:text-indigo-900"
              >
                {{
                  isTrainingDataMerged
                    ? "Load More Data"
                    : "Go to Training Upload"
                }}
                <span aria-hidden="true"> &rarr;</span>
              </router-link>
              <span v-else class="font-medium text-gray-500"
                >Personnel data required</span
              >
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-lg bg-white shadow">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ChartBarIcon
                  :class="[
                    'h-6 w-6',
                    isAllDataLoaded ? 'text-gray-400' : 'text-gray-300',
                  ]"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-4 w-0 flex-1">
                <dl>
                  <dt
                    :class="[
                      'truncate text-sm font-medium',
                      isAllDataLoaded ? 'text-gray-500' : 'text-gray-400',
                    ]"
                  >
                    Step 3
                  </dt>
                  <dd>
                    <div
                      :class="[
                        'text-lg font-medium',
                        isAllDataLoaded ? 'text-gray-900' : 'text-gray-500',
                      ]"
                    >
                      Analyze & Report
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div
            :class="[
              'px-5 py-3',
              isAllDataLoaded ? 'bg-gray-50' : 'bg-gray-200',
            ]"
          >
            <div class="text-sm">
              <router-link
                v-if="isAllDataLoaded"
                to="/reports"
                class="font-medium text-indigo-700 hover:text-indigo-900"
              >
                View Reports
                <span aria-hidden="true"> &rarr;</span>
              </router-link>
              <span v-else class="font-medium text-gray-500"
                >All data required</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="mt-10">
        <h2 class="text-lg font-medium text-gray-900">Quick Access</h2>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            @click="downloadPersonnelTemplate"
            class="group flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="flex-shrink-0 p-3 bg-green-500 rounded-lg">
              <ArrowDownTrayIcon class="h-6 w-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">
                Personnel Template
              </p>
              <p class="text-sm text-gray-500">Download Excel template</p>
            </div>
          </div>
          <router-link
            to="/syllabi"
            class="group flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div class="flex-shrink-0 p-3 bg-teal-500 rounded-lg">
              <DocumentDuplicateIcon class="h-6 w-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">
                Syllabus Management
              </p>
              <p class="text-sm text-gray-500">View and edit syllabi</p>
            </div>
          </router-link>
          <router-link
            to="/settings"
            class="group flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div class="flex-shrink-0 p-3 bg-purple-500 rounded-lg">
              <Cog6ToothIcon class="h-6 w-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">Settings</p>
              <p class="text-sm text-gray-500">Configure app options</p>
            </div>
          </router-link>
          <router-link
            to="/help"
            class="group flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div class="flex-shrink-0 p-3 bg-blue-500 rounded-lg">
              <QuestionMarkCircleIcon class="h-6 w-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">
                Help & Documentation
              </p>
              <p class="text-sm text-gray-500">Read the guide</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useProgressStore } from "@/stores/progressStore";
import { downloadPersonnelTemplate } from "@/core/excelProcessorServices/personnelProcessorService";
import {
  UsersIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/outline";

const personnelStore = usePersonnelStore();
const progressStore = useProgressStore();

const isPersonnelLoaded = computed(() => personnelStore.isDataLoaded);
const isTrainingDataMerged = computed(
  () => progressStore.lastMergedUpgraderIds.length > 0
);
const isAllDataLoaded = computed(
  () => isPersonnelLoaded.value && isTrainingDataMerged.value
);

const progressPercentage = computed(() => {
  if (isAllDataLoaded.value) return 100;
  if (isPersonnelLoaded.value) return 50;
  return 10;
});
</script>
