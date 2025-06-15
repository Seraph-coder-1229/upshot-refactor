<template>
  <div v-if="report" class="space-y-6">
    <div class="md:flex md:items-center md:justify-between">
      <div class="min-w-0 flex-1">
        <h1
          class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight"
        >
          Individual Report: {{ report.upgrader.displayName }}
        </h1>
        <p
          class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6 text-sm text-gray-500"
        >
          <span
            >PQS Level:
            <strong class="font-semibold text-gray-700">{{
              report.upgrader.derivedPqsWorkingLevel || "N/A"
            }}</strong></span
          >
          <span
            >Events Level:
            <strong class="font-semibold text-gray-700">{{
              report.upgrader.derivedEventsWorkingLevel || "N/A"
            }}</strong></span
          >
        </p>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <router-link
          :to="{ name: 'IndividualReportList' }"
          type="button"
          class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowLeftIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
          Back to List
        </router-link>
        <button
          @click="handlePrint"
          type="button"
          class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PrinterIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          Print to PDF
        </button>
      </div>
    </div>

    <div
      class="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
    >
      <div class="p-6">
        <h3 class="text-base font-semibold leading-7 text-gray-900">
          Training Summary
        </h3>
        <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          {{ summaryNarrative }}
        </p>

        <dl
          class="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            v-for="stat in summaryStats"
            :key="stat.name"
            class="rounded-lg bg-gray-50 p-4"
          >
            <dt class="flex items-center text-sm font-medium text-gray-500">
              <component :is="stat.icon" class="h-5 w-5 text-gray-400 mr-2" />
              <span>{{ stat.name }}</span>
            </dt>
            <dd
              class="mt-1 text-xl font-semibold tracking-tight text-gray-900"
              :class="stat.color"
            >
              {{ stat.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="border-t border-gray-200 p-6">
        <h3 class="text-base font-semibold leading-7 text-gray-900">
          Level Progression
        </h3>
        <div
          class="mt-4 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8"
        >
          <ProgressChart
            :upgrader="report.upgrader"
            :chart-type="RequirementType.PQS"
          />
          <ProgressChart
            :upgrader="report.upgrader"
            :chart-type="RequirementType.Event"
          />
        </div>
      </div>

      <div class="border-t border-gray-200 p-6">
        <h3 class="text-base font-semibold leading-7 text-gray-900">
          Priority Tasks
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Top 5 recommended next steps to continue progression.
        </p>
        <ul
          v-if="report.priorityTasks.length > 0"
          role="list"
          class="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200"
        >
          <li
            v-for="task in report.priorityTasks.slice(0, 5)"
            :key="task.id"
            class="flex items-center gap-x-3 py-3 px-2"
          >
            <div class="flex-none">
              <CheckCircleIcon
                v-if="task.isAvailable"
                class="h-6 w-6 text-green-500"
              />
              <LockClosedIcon v-else class="h-6 w-6 text-gray-400" />
            </div>
            <p class="flex-auto text-sm font-semibold text-gray-900">
              {{ task.displayName }} (L{{ task.level }})
            </p>
            <p class="flex-none text-xs text-gray-500">
              P-Score: {{ task.priorityScore.toFixed(0) }}
            </p>
          </li>
        </ul>
        <p v-else class="mt-4 text-sm text-gray-500 italic">
          No remaining tasks.
        </p>
      </div>
    </div>
  </div>
  <div v-else class="text-center p-8 bg-white rounded-lg shadow">
    <p>Generating report...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, computed } from "vue";
import { generateIndividualReport } from "@/core/reportGeneratorService";
import type { IndividualReport } from "@/types/reportTypes";
import { ReadinessStatus } from "@/types/personnelTypes";
import { RequirementType } from "@/types/syllabiTypes";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";
import ProgressChart from "../charts/ProgressChart.vue";
import {
  ArrowLeftIcon,
  PrinterIcon,
  ScaleIcon,
  ClockIcon,
  CheckCircleIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  ChartPieIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps<{
  upgraderId: string;
}>();

const report = ref<IndividualReport | null>(null);

onMounted(() => {
  report.value = generateIndividualReport(props.upgraderId);
});

const summaryNarrative = computed(() => {
  if (!report.value) return "";
  const { upgrader, summary } = report.value;
  const pacing = summary.pacingAgainstDeadlineDays;
  const pacingText =
    pacing >= 0 ? `${pacing} days ahead of` : `${Math.abs(pacing)} days behind`;
  return `${upgrader.displayName} is currently rated as ${summary.readinessAgainstDeadline}. They are pacing ${pacingText} schedule to meet their deadline.`;
});

const summaryStats = computed(() => {
  if (!report.value) return [];
  const { summary, upgrader } = report.value;
  return [
    {
      name: "Readiness Status",
      value: summary.readinessAgainstDeadline,
      icon: ScaleIcon,
      color: readinessColorClass(summary.readinessAgainstDeadline),
    },
    {
      name: "Pacing (Deadline)",
      value: `${summary.pacingAgainstDeadlineDays ?? "N/A"} days`,
      icon: ClockIcon,
      color:
        (summary.pacingAgainstDeadlineDays ?? 0) < 0
          ? "text-red-600"
          : "text-green-600",
    },
    {
      name: "Projected Completion",
      value: formatUtcDateToDisplay(summary.projectedCompletionDate),
      icon: RocketLaunchIcon,
      color: "text-gray-900",
    },
    {
      name: "Overall Progress",
      value: `${(
        ((upgrader.pqsProgressPercentage ?? 0) +
          (upgrader.eventsProgressPercentage ?? 0)) /
        2
      ).toFixed(0)}%`,
      icon: ChartPieIcon,
      color: "text-gray-900",
    },
  ];
});

const readinessColorClass = (status: ReadinessStatus) => {
  switch (status) {
    case ReadinessStatus.OnTrack:
      return "text-green-600 font-semibold";
    case ReadinessStatus.AtRisk:
      return "text-yellow-600 font-semibold";
    case ReadinessStatus.BehindSchedule:
      return "text-red-600 font-semibold";
    case ReadinessStatus.Blocked:
      return "text-red-800 font-bold";
    default:
      return "text-gray-900 font-semibold";
  }
};

const handlePrint = () => {
  window.print();
};
</script>
