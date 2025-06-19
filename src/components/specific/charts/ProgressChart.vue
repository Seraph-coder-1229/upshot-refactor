<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineProps } from "vue";
import Chart from "chart.js/auto";
import type { ChartDataPoint, ProgressDataPoint } from "@/types/reportTypes";
import { RequirementType } from "@/types/syllabiTypes";

const props = defineProps<{
  chartType: RequirementType;
  progressData: ChartDataPoint[]; // Renamed from chartData
  targetData: ChartDataPoint[];
  deadlineData: ChartDataPoint[];
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const renderChart = () => {
  if (!chartCanvas.value) return;
  if (chartInstance) {
    chartInstance.destroy();
  }

  const title =
    props.chartType === RequirementType.PQS ? "PQS Progress" : "Event Progress";
  const progressColor =
    props.chartType === RequirementType.PQS
      ? "rgb(54, 162, 235)"
      : "rgb(255, 99, 132)";

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Squadron Target",
          data: props.targetData,
          borderColor: "rgba(234, 179, 8, 0.7)",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        },
        {
          label: "Wing Deadline",
          data: props.deadlineData,
          borderColor: "rgba(220, 38, 38, 0.7)", // red-600
          borderDash: [10, 5],
          pointRadius: 0,
          fill: false,
          borderWidth: 2,
        },
        {
          label: "% Progress",
          data: props.progressData,
          borderColor: progressColor,
          fill: false,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Months Since Start Date",
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Progress (%)",
          },
        },
      },
    },
  });
};

onMounted(renderChart);
watch(() => props.progressData, renderChart);
</script>
