<template>
  <div class="h-80 w-full">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, PropType, defineProps } from "vue";
import { Chart, registerables, type ChartItem } from "chart.js";
import type { Upgrader } from "@/types/personnelTypes";
import { RequirementType, type Syllabus } from "@/types/syllabiTypes";
import { addDays, daysBetween, getTodayUtc } from "@/utils/dateUtils";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { useSyllabiStore } from "@/stores/syllabiStore";

Chart.register(...registerables);

const props = defineProps({
  upgrader: {
    type: Object as PropType<Upgrader>,
    required: true,
  },
  chartType: {
    type: String as PropType<RequirementType>,
    required: true,
  },
});

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

onMounted(() => {
  // --- SAFETY CHECKS ---
  if (!chartCanvas.value) return;

  const appConfigStore = useAppConfigStore();
  const syllabiStore = useSyllabiStore();

  const syllabus = syllabiStore.findSyllabus(
    props.upgrader.assignedPosition,
    props.upgrader.assignedSyllabusYear
  );

  if (!syllabus) return;

  // --- CORRECTED LOGIC: Use the upgrader's CURRENT working level ---
  const currentLevel =
    props.chartType === RequirementType.PQS
      ? props.upgrader.derivedPqsWorkingLevel
      : props.upgrader.derivedEventsWorkingLevel;

  if (!currentLevel) return;

  // --- CORRECTED LOGIC: Access the new config structure ---
  const deadlines =
    appConfigStore.currentConfig.positionSettings[
      props.upgrader.assignedPosition
    ]?.deadlines[currentLevel];
  if (!deadlines) {
    console.warn(
      `No deadlines found for ${props.upgrader.assignedPosition} L${currentLevel}. Cannot render chart.`
    );
    return;
  }

  const { targetMonths, deadlineMonths } = deadlines;
  const labels = Array.from(
    { length: deadlineMonths + 1 },
    (_, i) => `Month ${i}`
  );

  // --- CORRECTED LOGIC: Calculate progress WITHIN the current level, not cumulatively ---
  const reqsForCurrentLevel = syllabus.requirements.filter(
    (r) =>
      r.level === currentLevel &&
      r.type === props.chartType &&
      !r.isDefaultWaived
  );
  const totalRequirementCount = reqsForCurrentLevel.length;
  if (totalRequirementCount === 0) return;

  const today = getTodayUtc();
  const monthsSinceStart = daysBetween(props.upgrader.startDate, today) / 30.44;

  const actualData = labels.map((_, i) => {
    if (i > monthsSinceStart) return null;
    const monthEndDate = addDays(props.upgrader.startDate, i * 30.44);

    const completedCount = props.upgrader.rawCompletions.filter((c) => {
      const req = reqsForCurrentLevel.find(
        (r) => r.name.toUpperCase() === c.event.toUpperCase()
      );
      return req && c.date <= monthEndDate;
    }).length;

    return (completedCount / totalRequirementCount) * 100;
  });

  const lastValidIndex = actualData.findLastIndex((v) => v !== null);
  const lastKnownProgress =
    lastValidIndex > -1 ? actualData[lastValidIndex] : 0;

  // --- Projection logic (remains the same, but now projects from current level's progress) ---
  const projectionDate =
    props.chartType === RequirementType.PQS
      ? props.upgrader.projectedPqsCompletionDate
      : props.upgrader.projectedEventsCompletionDate;
  const projectionData: (number | null)[] = new Array(labels.length).fill(null);

  if (projectionDate && lastKnownProgress != null && lastKnownProgress < 100) {
    projectionData[lastValidIndex] = lastKnownProgress;
    const projectionEndMonth = Math.ceil(
      daysBetween(props.upgrader.startDate, projectionDate) / 30.44
    );
    if (
      projectionEndMonth > lastValidIndex &&
      projectionEndMonth < labels.length
    ) {
      projectionData[projectionEndMonth] = 100;
    }
  }

  // --- Chart Rendering ---
  const ctx = chartCanvas.value.getContext("2d");
  if (ctx) {
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          // ... (datasets for Target, Deadline, Actual, and Projection are the same)
        ],
      },
      options: {
        // ... (options are the same)
      },
    });
  }
});

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>
