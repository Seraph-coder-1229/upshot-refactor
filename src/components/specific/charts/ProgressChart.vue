<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineProps } from "vue";
import Chart from "chart.js/auto";
import type { ProgressDataPoint } from "@/types/reportTypes";
import { RequirementType } from "@/types/syllabiTypes";

const props = defineProps<{
  chartData: ProgressDataPoint[];
  chartType: RequirementType;
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

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      datasets: [
        {
          label: "% Progress",
          data: props.chartData,
          borderColor:
            props.chartType === RequirementType.PQS
              ? "rgb(54, 162, 235)"
              : "rgb(255, 99, 132)",
          backgroundColor:
            props.chartType === RequirementType.PQS
              ? "rgba(54, 162, 235, 0.5)"
              : "rgba(255, 99, 132, 0.5)",
          fill: true,
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
watch(() => props.chartData, renderChart);
</script>
