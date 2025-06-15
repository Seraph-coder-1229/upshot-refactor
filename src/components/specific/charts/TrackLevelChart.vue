<template>
  <div class="h-96 w-full">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  type PropType,
  defineProps,
} from "vue";
import { Chart, registerables } from "chart.js";
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
  chartType: {
    type: String as PropType<RequirementType>,
    required: true,
    validator: (value: string) =>
      [RequirementType.PQS, RequirementType.Event].includes(
        value as RequirementType
      ),
  },
});

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// Helper to generate distinct colors for each upgrader line
function generateColor(index: number, alpha = 1): string {
  const colors = [
    `rgba(59, 130, 246, ${alpha})`, // blue
    `rgba(16, 185, 129, ${alpha})`, // green
    `rgba(239, 68, 68, ${alpha})`, // red
    `rgba(245, 158, 11, ${alpha})`, // amber
    `rgba(139, 92, 246, ${alpha})`, // violet
    `rgba(236, 72, 153, ${alpha})`, // pink
    `rgba(20, 184, 166, ${alpha})`, // teal
    `rgba(99, 102, 241, ${alpha})`, // indigo
  ];
  return colors[index % colors.length];
}

// This function will create or update the chart
const renderChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  if (!chartCanvas.value || props.upgraders.length === 0) return;

  const syllabiStore = useSyllabiStore();
  const appConfigStore = useAppConfigStore();
  const firstUpgrader = props.upgraders[0];

  const syllabus = syllabiStore.findSyllabus(
    firstUpgrader.assignedPosition,
    firstUpgrader.assignedSyllabusYear
  );

  if (!syllabus) {
    console.warn(
      `No syllabus found for ${firstUpgrader.assignedPosition} ${firstUpgrader.assignedSyllabusYear}`
    );
    return;
  }

  // Get deadlines and set max months for the chart
  const deadlines = appConfigStore.getDeadlinesForPositionLevel(
    firstUpgrader.assignedPosition,
    props.level
  );

  if (!deadlines) {
    console.warn(
      `No deadlines configured for ${firstUpgrader.assignedPosition} level ${props.level}`
    );
    return;
  }

  const { targetMonths, deadlineMonths } = deadlines;
  const maxMonths = deadlineMonths + 3; // Requirement: track deadline + 3 months
  const labels = Array.from({ length: maxMonths + 1 }, (_, i) => `Month ${i}`);

  const reqsForLevel = syllabus.requirements.filter(
    (r) =>
      String(r.level) === props.level &&
      r.type === props.chartType &&
      !r.isDefaultWaived
  );

  const totalReqsCount = reqsForLevel.length;
  if (totalReqsCount === 0) return; // Don't render chart if no requirements for this type/level

  const today = getTodayUtc();
  const datasets: any[] = [];

  // Create a dataset for each upgrader
  props.upgraders.forEach((upgrader, index) => {
    const monthsSinceStart = daysBetween(upgrader.startDate, today) / 30.44;
    const color = generateColor(index);

    const actualData = labels.map((_, monthIndex) => {
      if (monthIndex > monthsSinceStart) return null; // Don't plot future actuals

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
  });

  // Add Squadron Target and Wing Deadline lines
  datasets.push(
    {
      label: "Squadron Target",
      data: labels
        .map((_, i) => (targetMonths > 0 ? (100 / targetMonths) * i : null))
        .map((val) => (val !== null && val > 100 ? 100 : val)), // Cap at 100%
      borderColor: "rgba(234, 179, 8, 0.7)", // amber-400
      borderDash: [10, 5],
      pointRadius: 0,
      fill: false,
      borderWidth: 2,
    },
    {
      label: "Wing Deadline",
      data: labels
        .map((_, i) => (deadlineMonths > 0 ? (100 / deadlineMonths) * i : null))
        .map((val) => (val !== null && val > 100 ? 100 : val)), // Cap at 100%
      borderColor: "rgba(220, 38, 38, 0.7)", // red-600
      borderDash: [10, 5],
      pointRadius: 0,
      fill: false,
      borderWidth: 2,
    }
  );

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
          font: { size: 16 },
        },
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 20,
            font: { size: 10 },
          },
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
            text: "Months Since Student Start Date",
          },
        },
      },
    },
  });
};

// Initial mount
onMounted(renderChart);

// Watch for prop changes to re-render the chart
watch(() => [props.upgraders, props.level, props.chartType], renderChart, {
  deep: true,
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>
