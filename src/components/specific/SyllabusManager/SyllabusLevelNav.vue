<template>
  <nav class="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50/50 p-4">
    <h3 class="text-xs font-semibold uppercase text-gray-500 tracking-wider">
      ACTC Levels
    </h3>
    <ul role="list" class="mt-2 space-y-1">
      <li v-for="level in availableLevels" :key="level">
        <a
          @click="$emit('level-selected', level)"
          class="cursor-pointer group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
          :class="
            level === selectedLevel
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-200'
          "
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white transition-colors"
            :class="
              level === selectedLevel
                ? 'border-indigo-600 text-indigo-600'
                : 'text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600'
            "
          >
            {{ level.toString().charAt(0) }}
          </span>
          <span class="truncate">Level {{ level }}</span>
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
  if (!props.syllabus || !props.syllabus.requirements) return [];
  const levels = new Set(props.syllabus.requirements.map((r) => r.level));
  return Array.from(levels).sort((a, b) => a - b);
});
</script>
