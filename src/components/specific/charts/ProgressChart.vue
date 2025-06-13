<template>
  <div class="h-80 w-full">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, PropType, defineProps } from "vue";
import { Chart, registerables } from "chart.js";
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
  if (!chartCanvas.value) return;

  const appConfigStore = useAppConfigStore();
  const syllabiStore = useSyllabiStore();

  const syllabus = syllabiStore.findSyllabus(
    props.upgrader.assignedPosition,
    props.upgrader.assignedSyllabusYear
  );

  if (!syllabus) return;

  const currentLevel =
    props.chartType === RequirementType.PQS
      ? props.upgrader.derivedPqsWorkingLevel
      : props.upgrader.derivedEventsWorkingLevel;

  if (!currentLevel) return;

  const deadlines =
    appConfigStore.currentConfig.positionSettings[
      props.upgrader.assignedPosition
    ]?.deadlines[currentLevel];

  if (!deadlines) return;

  const { targetMonths, deadlineMonths } = deadlines;
  const labels = Array.from(
    { length: deadlineMonths + 1 },
    (_, i) => `Month ${i}`
  );

  const reqsForCurrentLevel = syllabus.requirements.filter(
    (r) =>
      String(r.level) === currentLevel &&
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

  const ctx = chartCanvas.value.getContext("2d");
  if (ctx) {
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        // --- FIX ---
        // The datasets array was empty before. It is now correctly populated.
        datasets: [
          {
            label: "Squadron Target",
            data: labels.map((_, i) =>
              targetMonths > 0 ? (100 / targetMonths) * i : null
            ),
            borderColor: "rgba(234, 179, 8, 0.7)",
            borderDash: [10, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: "Wing Deadline",
            data: labels.map((_, i) =>
              deadlineMonths > 0 ? (100 / deadlineMonths) * i : null
            ),
            borderColor: "rgba(220, 38, 38, 0.7)",
            borderDash: [10, 5],
            pointRadius: 0,
            fill: false,
          },
          {
            label: "Actual Progress",
            data: actualData,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.1,
            fill: false,
          },
          {
            label: "Projection",
            data: projectionData,
            borderColor: "rgba(22, 163, 74, 1)",
            borderDash: [3, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: `${props.chartType} Progress`,
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: "% Complete",
            },
          },
          x: {
            title: {
              display: true,
              text: "Months Since Start Date",
            },
          },
        },
      },
    });
  }
});

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>
