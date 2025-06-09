<template>
  <div class="p-4 bg-white rounded-lg border">
    <h4 class="text-lg font-semibold mb-4 border-b pb-2">Edit Requirement</h4>
    <div v-if="editableRequirement" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Display Name</label
          >
          <input
            type="text"
            v-model="editableRequirement.displayName"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Long Name / Unique ID</label
          >
          <input
            type="text"
            v-model="editableRequirement.name"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Type</label>
          <select
            v-model="editableRequirement.type"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          >
            <option :value="RequirementType.PQS">PQS</option>
            <option :value="RequirementType.Event">Event</option>
            <option :value="RequirementType.Board">Board</option>
            <option :value="RequirementType.Other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Level</label>
          <input
            type="number"
            v-model.number="editableRequirement.level"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Difficulty
          </label>
          <input
            type="number"
            v-model.number="editableRequirement.difficulty"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </div>
      </div>

      <div class="pt-2">
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            v-model="editableRequirement.isDefaultWaived"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-sm font-medium text-gray-700">Waived</span>
        </label>
        <p class="text-xs text-gray-500 ml-7">
          Check this if the requirement is waived.
        </p>
      </div>

      <div class="mt-6 flex justify-end space-x-3 border-t pt-4">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="$emit('update:requirement', editableRequirement)"
          class="px-4 py-2 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType, defineProps, defineEmits } from "vue";
import { type Requirement, RequirementType } from "@/types/syllabiTypes";

const props = defineProps({
  requirement: {
    type: Object as PropType<Requirement>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "update:requirement", updatedRequirement: Requirement): void;
  (e: "cancel"): void;
}>();

const editableRequirement = ref<Requirement>({ ...props.requirement });

watch(
  () => props.requirement,
  (newRequirement) => {
    // Ensure the checkbox has a boolean value to bind to
    editableRequirement.value = {
      ...newRequirement,
      isDefaultWaived: !!newRequirement.isDefaultWaived,
    };
  },
  { deep: true, immediate: true }
);
</script>
