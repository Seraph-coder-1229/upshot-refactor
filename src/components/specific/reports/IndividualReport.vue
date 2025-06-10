<template>
  <div
    v-if="report"
    class="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
  >
    <div class="p-6">
      <h2 class="text-xl font-bold text-gray-800">
        Individual Report for {{ report.upgrader.displayName }}
      </h2>
      <p class="text-sm text-gray-500">
        Status:
        <span
          :class="readinessColorClass(report.summary.readinessAgainstDeadline)"
          class="font-semibold"
          >{{ report.summary.readinessAgainstDeadline }}</span
        >
      </p>
    </div>
    <div
      class="border-t border-gray-200 px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-center"
    >
      <div>
        <div class="text-sm text-gray-500">Pacing (Deadline)</div>
        <div class="text-lg font-medium text-gray-800">
          {{ report.summary.pacingAgainstDeadlineDays }} days
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-500">Projected Completion</div>
        <div class="text-lg font-medium text-gray-800">
          {{ formatUtcDateToDisplay(report.summary.projectedCompletionDate) }}
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-500">
          PQS Progress (L{{ report.upgrader.derivedPqsWorkingLevel }})
        </div>
        <div class="text-lg font-medium text-gray-800">
          {{ report.upgrader.pqsProgressPercentage?.toFixed(0) ?? 0 }}%
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-500">
          Event Progress (L{{ report.upgrader.derivedEventsWorkingLevel }})
        </div>
        <div class="text-lg font-medium text-gray-800">
          {{ report.upgrader.eventsProgressPercentage?.toFixed(0) ?? 0 }}%
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-gray-200 space-y-8">
      <ProgressChart
        :upgrader="report.upgrader"
        :chart-type="RequirementType.PQS"
      />
      <ProgressChart
        :upgrader="report.upgrader"
        :chart-type="RequirementType.Event"
      />
    </div>

    <div class="p-6 border-t border-gray-200">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">Priority Tasks</h3>
      <ul v-if="report.priorityTasks.length > 0" class="space-y-2">
        <li
          v-for="task in report.priorityTasks.slice(0, 5)"
          :key="task.id"
          class="p-3 rounded-md flex items-center"
          :class="{
            'bg-green-50 border-l-4 border-green-500': task.isAvailable,
            'bg-gray-100 border-l-4 border-gray-400 text-gray-600':
              !task.isAvailable,
          }"
        >
          <span class="font-medium flex-grow"
            >{{ task.displayName }} (L{{ task.level }})</span
          >
          <span class="text-sm"
            >Unlocks: {{ task.unlocks }} | P-Score:
            {{ task.priorityScore.toFixed(0) }}</span
          >
        </li>
      </ul>
      <p v-else class="text-gray-500 italic">No remaining tasks.</p>
    </div>
  </div>
  <div v-else class="text-center p-8 bg-white rounded-lg shadow">
    <p>Generating report...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps } from "vue";
import { generateIndividualReport } from "@/core/reportGeneratorService";
import type { IndividualReport } from "@/types/reportTypes";
import { ReadinessStatus } from "@/types/personnelTypes";
import { RequirementType } from "@/types/syllabiTypes";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";
import ProgressChart from "../charts/ProgressChart.vue";

const props = defineProps<{
  upgraderId: string;
}>();

const report = ref<IndividualReport | null>(null);

onMounted(() => {
  report.value = generateIndividualReport(props.upgraderId);
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
