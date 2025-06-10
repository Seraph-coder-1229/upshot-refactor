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
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useAppConfigStore } from "@/stores/appConfigStore";

Chart.register(...registerables);

const props = defineProps({
  upgraders: {
    type: Array as PropType<Upgrader[]>,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  // CORRECTED: Simplified prop type definition
  chartType: {
    type: String as PropType<RequirementType>,
    required: true,
    validator: (value: RequirementType) => {
      // Ensure the chart is only used for PQS or Event types
      return [RequirementType.PQS, RequirementType.Event].includes(value);
    },
  },
});

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

function generateColor(index: number, alpha = 1): string {
  const colors = [
    `rgba(59, 130, 246, ${alpha})`,
    `rgba(22, 163, 74, ${alpha})`,
    `rgba(239, 68, 68, ${alpha})`,
    `rgba(249, 115, 22, ${alpha})`,
    `rgba(139, 92, 246, ${alpha})`,
    `rgba(217, 70, 239, ${alpha})`,
  ];
  return colors[index % colors.length];
}

onMounted(() => {
  // --- SAFETY CHECK ---
  if (!chartCanvas.value || props.upgraders.length === 0) return;

  const syllabiStore = useSyllabiStore();
  const appConfigStore = useAppConfigStore();

  const firstUpgrader = props.upgraders[0];
  const syllabus = syllabiStore.findSyllabus(
    firstUpgrader.assignedPosition,
    firstUpgrader.assignedSyllabusYear
  );
  if (!syllabus) return;

  // This lookup will now work correctly because props.level is a string
  const deadlines =
    appConfigStore.currentConfig.positionSettings[
      firstUpgrader.assignedPosition
    ]?.deadlines[props.level];
  if (!deadlines) return;

  const { targetMonths, deadlineMonths } = deadlines;
  const labels = Array.from(
    { length: deadlineMonths + 1 },
    (_, i) => `Month ${i}`
  );

  const reqsForLevel = syllabus.requirements.filter(
    (r) =>
      r.level === props.level &&
      r.type === props.chartType &&
      !r.isDefaultWaived
  );
  const totalReqsCount = reqsForLevel.length;
  if (totalReqsCount === 0) return;

  const today = getTodayUtc();
  const datasets: any[] = [];

  // --- Generate dataset for each student ---
  props.upgraders.forEach((upgrader, index) => {
    const monthsSinceStart = daysBetween(upgrader.startDate, today) / 30.44;
    const color = generateColor(index);

    const actualData = labels.map((_, monthIndex) => {
      if (monthIndex > monthsSinceStart) return null;
      const monthEndDate = addDays(upgrader.startDate, monthIndex * 30.44);
      const completedCount = upgrader.rawCompletions.filter((comp) => {
        const req = reqsForLevel.find(
          (r) => r.name.toUpperCase() === comp.event.toUpperCase()
        );
        return req && comp.date <= monthEndDate;
      }).length;
      return (completedCount / totalReqsCount) * 100;
    });

    datasets.push({
      label: upgrader.displayName,
      data: actualData,
      borderColor: color,
      backgroundColor: color.replace(/, \d?\.?\d*\)$/, ", 0.1)"),
      tension: 0.1,
      borderWidth: 2,
    });

    // --- Add Projection Line ---
    const projectionDate =
      props.chartType === RequirementType.PQS
        ? upgrader.projectedPqsCompletionDate
        : upgrader.projectedEventsCompletionDate;
    const lastValidIndex = actualData.findLastIndex((v) => v !== null);
    const lastKnownProgress =
      lastValidIndex > -1 ? actualData[lastValidIndex] : 0;

    if (
      projectionDate &&
      lastKnownProgress != null &&
      lastKnownProgress < 100
    ) {
      const projectionData = new Array(labels.length).fill(null);
      projectionData[lastValidIndex] = lastKnownProgress;
      const projectionEndMonth = Math.ceil(
        daysBetween(upgrader.startDate, projectionDate) / 30.44
      );
      if (
        projectionEndMonth > lastValidIndex &&
        projectionEndMonth < labels.length
      ) {
        projectionData[projectionEndMonth] = 100;
      }
      datasets.push({
        label: `${upgrader.displayName} (Proj)`,
        data: projectionData,
        borderColor: color,
        borderDash: [3, 4],
        pointRadius: 0,
        fill: false,
        borderWidth: 1.5,
      });
    }
  });

  // --- Add Standard Lines ---
  datasets.push({
    label: "Squadron Target",
    data: labels.map((_, i) =>
      targetMonths > 0 ? (100 / targetMonths) * i : null
    ),
    borderColor: "rgba(234, 179, 8, 0.7)",
    borderDash: [10, 5],
    pointRadius: 0,
    fill: false,
    borderWidth: 2,
  });
  datasets.push({
    label: "Wing Deadline",
    data: labels.map((_, i) =>
      deadlineMonths > 0 ? (100 / deadlineMonths) * i : null
    ),
    borderColor: "rgba(220, 38, 38, 0.7)",
    borderDash: [10, 5],
    pointRadius: 0,
    fill: false,
    borderWidth: 2,
  });

  // --- SAFETY CHECK ---
  const ctx = chartCanvas.value.getContext("2d");
  if (!ctx) return;

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `L${props.level} ${props.chartType} Progress`,
        },
        legend: {
          labels: {
            filter: (item) => !item.text.includes("(Proj)"),
            boxWidth: 20,
            font: { size: 10 },
          },
        },
      },
      scales: {
        y: { min: 0, max: 100, title: { display: true, text: "% Complete" } },
        x: {
          title: { display: true, text: "Months Since Student Start Date" },
        },
      },
    },
  });
});

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>
