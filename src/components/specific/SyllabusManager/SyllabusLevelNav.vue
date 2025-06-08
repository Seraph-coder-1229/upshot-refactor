<template>
  <nav class="w-48 flex-shrink-0 border-r pr-4">
    <h3 class="text-lg font-semibold text-gray-900">
      {{ syllabus.displayName }}
    </h3>
    <p class="text-sm text-gray-500">ACTC Levels</p>
    <ul role="list" class="mt-4 space-y-1">
      <li v-for="level in availableLevels" :key="level">
        <a
          @click="$emit('level-selected', level)"
          class="cursor-pointer group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
          :class="{ 'bg-gray-50 text-indigo-600': level === selectedLevel }"
        >
          Level {{ level }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed, type PropType, defineProps, defineEmits } from "vue";
import { type Syllabus } from "@/types/syllabiTypes";

const props = defineProps({
  syllabus: { type: Object as PropType<Syllabus>, required: true },
  selectedLevel: { type: Number, required: true },
});
defineEmits(["level-selected"]);

const availableLevels = computed(() => {
  const levels = new Set(props.syllabus.requirements.map((r) => r.level));
  return Array.from(levels).sort((a, b) => a - b);
});
</script>
