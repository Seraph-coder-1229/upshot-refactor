<template>
  <div v-if="report" class="space-y-8 p-4 md:p-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Monthly Training Report</h1>
      <p class="text-sm text-gray-500">
        Generated for {{ report.reportDate.toLocaleDateString() }}
      </p>
    </div>

    <div
      v-if="report.summaryStats"
      class="bg-white shadow-lg rounded-lg border border-gray-200 p-6"
    >
      <h3 class="text-lg font-semibold leading-7 text-gray-900">
        Squadron Health Summary
      </h3>
      <dl class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg bg-blue-50 p-4">
          <dt class="text-sm font-medium text-blue-600">Track Health</dt>
          <dd class="mt-1 text-3xl font-semibold text-blue-900">
            {{ report.summaryStats.trackHealthPercentage.toFixed(0) }}%
          </dd>
          <p class="text-xs text-gray-500">
            {{ report.summaryStats.upgradersOnTrack }} of
            {{ report.summaryStats.totalUpgraders }} upgraders on track
          </p>
        </div>
        <div class="rounded-lg bg-green-50 p-4">
          <dt class="text-sm font-medium text-green-600">Avg. Cost Factor</dt>
          <dd class="mt-1 text-3xl font-semibold text-green-900">
            {{ report.summaryStats.averageCostFactor.toFixed(2) }}
          </dd>
          <p class="text-xs text-gray-500">Squadron average effort score</p>
        </div>
        <div class="rounded-lg bg-yellow-50 p-4">
          <dt class="text-sm font-medium text-yellow-600">
            Items For Ideal Pace
          </dt>
          <dd class="mt-1 text-xl font-semibold text-yellow-900">
            {{ report.summaryStats.totalEventsNeededThisMonth }} Events /
            {{ report.summaryStats.totalPqsNeededThisMonth }} PQS
          </dd>
          <p class="text-xs text-gray-500">Needed this month across squadron</p>
        </div>
      </dl>
    </div>

    <div
      v-if="report.priorityTasks"
      class="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div v-for="group in priorityGroups" :key="group.title">
        <h3 class="text-xl font-semibold mb-2">{{ group.title }} Priorities</h3>
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <ul role="list" class="divide-y divide-gray-200">
            <li
              v-for="task in group.tasks"
              :key="task.id + task.upgraderName"
              class="px-4 py-3 hover:bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex-grow">
                  <p
                    class="text-sm font-medium text-gray-900 truncate"
                    :title="task.displayName"
                  >
                    {{ task.displayName }}
                  </p>
                  <p class="text-sm text-gray-500">{{ task.upgraderName }}</p>
                </div>
                <div class="ml-4 flex-shrink-0 text-right">
                  <p class="text-sm font-semibold text-indigo-600">
                    {{ task.priorityScore.toFixed(0) }}
                  </p>
                  <p class="text-xs text-gray-500">Score</p>
                </div>
              </div>
            </li>
            <li
              v-if="group.tasks.length === 0"
              class="px-4 py-4 text-sm text-gray-500 text-center italic"
            >
              No priority items.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center p-8">
    <p class="text-gray-500">Generating monthly report...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { generateMonthlyReport } from "@/core/reportGeneratorService";
import type {
  MonthlyReportData,
  MonthlyPriorityTask,
} from "@/types/reportTypes";

const report = ref<MonthlyReportData | null>(null);

interface PriorityGroup {
  title: string;
  tasks: MonthlyPriorityTask[];
}

const priorityGroups = computed((): PriorityGroup[] => {
  if (!report.value?.priorityTasks) return [];
  return [
    { title: "PQS", tasks: report.value.priorityTasks.pqs },
    { title: "Boards", tasks: report.value.priorityTasks.boards },
    { title: "Events", tasks: report.value.priorityTasks.events },
  ];
});

onMounted(() => {
  report.value = generateMonthlyReport();
});
</script>
