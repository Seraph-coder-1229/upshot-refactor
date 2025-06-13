<!-- src/components/ui/ProgressWheel.vue -->
<template>
  <div class="relative h-10 w-10">
    <svg class="h-full w-full" viewBox="0 0 100 100">
      <!-- Background circle -->
      <circle
        class="text-gray-200"
        stroke-width="10"
        stroke="currentColor"
        fill="transparent"
        r="45"
        cx="50"
        cy="50"
      />
      <!-- Progress circle -->
      <circle
        :class="progressColorClass"
        stroke-width="10"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeOffset"
        stroke-linecap="round"
        stroke="currentColor"
        fill="transparent"
        r="45"
        cx="50"
        cy="50"
        transform="rotate(-90 50 50)"
      />
    </svg>
    <!-- Percentage text -->
    <span
      class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700"
    >
      {{ Math.round(progress) }}%
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    default: 0,
  },
});

const circumference = 2 * Math.PI * 45;

const strokeOffset = computed(() => {
  const progressValue = Math.max(0, Math.min(100, props.progress));
  return circumference - (progressValue / 100) * circumference;
});

const progressColorClass = computed(() => {
  if (props.progress < 33) return "text-red-500";
  if (props.progress < 66) return "text-yellow-500";
  return "text-green-500";
});
</script>
