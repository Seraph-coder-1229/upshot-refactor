<template>
  <div class="bg-white rounded-lg max-w-4xl mx-auto">
    <h4 class="text-xl font-semibold mb-4 text-gray-800">Edit Requirement</h4>
    <div v-if="editableRequirement" class="space-y-6">
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-md"
      >
        <div>
          <label
            for="displayName"
            class="block text-sm font-medium text-gray-700"
            >Display Name</label
          >
          <input
            type="text"
            id="displayName"
            v-model="editableRequirement.displayName"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          />
        </div>
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700"
            >Unique Name / ID</label
          >
          <input
            type="text"
            id="name"
            v-model="editableRequirement.name"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          />
        </div>
        <div class="md:col-span-2">
          <label
            for="description"
            class="block text-sm font-medium text-gray-700"
            >Description</label
          >
          <textarea
            id="description"
            v-model="editableRequirement.description"
            rows="2"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          ></textarea>
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 p-4 border rounded-md"
      >
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700"
            >Type</label
          >
          <select
            id="type"
            v-model="editableRequirement.type"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          >
            <option v-for="type in RequirementType" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="rawSharpEventSubtype"
            class="block text-sm font-medium text-gray-700"
            >SHARP SubType</label
          >
          <input
            type="text"
            id="rawSharpEventSubtype"
            v-model="editableRequirement.rawSharpEventSubtype"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          />
        </div>
        <div>
          <label for="level" class="block text-sm font-medium text-gray-700"
            >Level</label
          >
          <input
            type="number"
            id="level"
            v-model.number="editableRequirement.level"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          />
        </div>
        <div>
          <label
            for="difficulty"
            class="block text-sm font-medium text-gray-700"
            >Difficulty</label
          >
          <input
            type="number"
            id="difficulty"
            v-model.number="editableRequirement.difficulty"
            placeholder="Default: 1"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          />
        </div>
        <div class="md:col-span-4">
          <label
            for="prerequisites"
            class="block text-sm font-medium text-gray-700"
            >Prerequisites</label
          >
          <input
            type="text"
            id="prerequisites"
            :value="prerequisitesString"
            @input="
              updatePrerequisites(($event.target as HTMLInputElement).value)
            "
            placeholder="Enter req IDs, comma-separated"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
          />
        </div>
        <div class="md:col-span-4 flex items-center">
          <label class="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="editableRequirement.isDefaultWaived"
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span class="text-sm font-medium text-gray-700"
              >Waived by Default</span
            >
          </label>
        </div>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="save"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  type PropType,
  defineProps,
  defineEmits,
} from "vue";
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

const prerequisitesString = computed(() => {
  return editableRequirement.value.prerequisites?.join(", ") || "";
});

const updatePrerequisites = (value: string) => {
  editableRequirement.value.prerequisites = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

watch(
  () => props.requirement,
  (newRequirement) => {
    editableRequirement.value = {
      ...newRequirement,
      isDefaultWaived: !!newRequirement.isDefaultWaived,
    };
  },
  { deep: true, immediate: true }
);

const save = () => {
  emit("update:requirement", editableRequirement.value);
};
</script>
