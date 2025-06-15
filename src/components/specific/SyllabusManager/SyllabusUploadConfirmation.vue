<template>
  <BaseModal :is-open="isOpen" title="Confirm Syllabus" @close="$emit('deny')">
    <template #body>
      <div v-if="syllabus" class="space-y-4">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
        >
          <CheckIcon class="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <div class="mt-3 text-center sm:mt-5">
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            Syllabus Parsed
          </h3>
          <p class="mt-2 text-sm text-gray-500">
            Please review the details below before saving.
          </p>
        </div>

        <div
          class="mt-6 border-t border-b border-gray-200 divide-y divide-gray-200"
        >
          <div class="py-4 flex items-center justify-between">
            <dt class="text-sm font-medium text-gray-600 flex items-center">
              <UserGroupIcon class="h-5 w-5 text-gray-400 mr-3" />
              Track / Position
            </dt>
            <dd class="text-sm font-semibold text-gray-900">
              {{ syllabus.position || "N/A" }}
            </dd>
          </div>

          <div class="py-4 flex items-center justify-between">
            <dt class="text-sm font-medium text-gray-600 flex items-center">
              <CalendarDaysIcon class="h-5 w-5 text-gray-400 mr-3" />
              Year
            </dt>
            <dd class="text-sm font-semibold text-gray-900">
              {{ syllabus.year || "N/A" }}
            </dd>
          </div>

          <div class="py-4 flex items-center justify-between">
            <dt class="text-sm font-medium text-gray-600 flex items-center">
              <ClipboardDocumentListIcon class="h-5 w-5 text-gray-400 mr-3" />
              Total Requirements
            </dt>
            <dd class="text-sm font-semibold text-gray-900">
              {{
                Array.isArray(syllabus.requirements)
                  ? syllabus.requirements.length
                  : 0
              }}
            </dd>
          </div>

          <div class="py-4 flex items-center justify-between">
            <dt class="text-sm font-medium text-gray-600 flex items-center">
              <Bars3BottomLeftIcon class="h-5 w-5 text-gray-400 mr-3" />
              Detected Levels
            </dt>
            <dd class="text-sm font-semibold text-gray-900">
              {{ distinctLevels }}
            </dd>
          </div>
        </div>
      </div>
      <div v-else class="text-center">
        <p>Loading syllabus details...</p>
      </div>
    </template>

    <template #footer>
      <div class="flex flex-col sm:flex-row-reverse gap-3">
        <button
          type="button"
          @click="$emit('accept')"
          class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto sm:text-sm"
        >
          Accept & Save
        </button>
        <button
          type="button"
          @click="$emit('edit')"
          class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
        >
          Edit
        </button>
        <button
          type="button"
          @click="$emit('deny')"
          class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
        >
          Deny
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
import { loggingService } from "@/utils/loggingService";
import {
  CheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  Bars3BottomLeftIcon,
} from "@heroicons/vue/24/outline";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  syllabus: {
    type: Object as PropType<Syllabus | null>,
    default: null,
  },
});

defineEmits(["accept", "edit", "deny"]);

const distinctLevels = computed(() => {
  if (
    !props.syllabus ||
    !Array.isArray(props.syllabus.requirements) ||
    props.syllabus.requirements.length === 0
  ) {
    return "N/A";
  }
  try {
    const levels = getUniqueValues(
      props.syllabus.requirements.map((r) => r.level.toString())
    );
    return levels
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .join(", ");
  } catch (error) {
    loggingService.error("Could not compute distinct levels:", error);
    return "Error";
  }
});
</script>
