<template>
  <BaseModal :is-open="isOpen" title="Syllabus Uploaded" @close="$emit('deny')">
    <div v-if="syllabus" class="space-y-4">
      <p>
        A new syllabus has been parsed successfully. Please review the details
        below.
      </p>
      <div class="p-4 bg-gray-50 rounded-lg border">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
          <dt class="font-medium text-gray-600">Track:</dt>
          <dd class="text-gray-800">{{ syllabus.position }}</dd>

          <dt class="font-medium text-gray-600">Year:</dt>
          <dd class="text-gray-800">{{ syllabus.year }}</dd>

          <dt class="font-medium text-gray-600">Total Requirements:</dt>
          <dd class="text-gray-800">{{ syllabus.requirements.length }}</dd>

          <dt class="font-medium text-gray-600">Levels:</dt>
          <dd class="text-gray-800">{{ distinctLevels }}</dd>
        </dl>
      </div>
      <p>What would you like to do?</p>
    </div>
    <div v-else class="text-center">
      <p>Loading syllabus details...</p>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('deny')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Deny
        </button>
        <button
          @click="$emit('edit')"
          class="px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-600"
        >
          Edit
        </button>
        <button
          @click="$emit('accept')"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
        >
          Accept
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, PropType, defineProps, defineEmits } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import type { Syllabus } from "@/types/syllabiTypes";
import { getUniqueValues } from "@/utils/arrayUtils";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  syllabus: {
    type: Object as PropType<Syllabus | null>,
    required: true,
  },
});

defineEmits(["accept", "edit", "deny"]);

const distinctLevels = computed(() => {
  if (!props.syllabus) return "";
  const levels = getUniqueValues(
    props.syllabus.requirements.map((r) => r.level.toString())
  );
  return levels.join(", ");
});
</script>
