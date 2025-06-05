<template>
  <div
    class="p-3 my-2 border rounded-md bg-white shadow-sm hover:shadow-md transition-shadow"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <label
          :for="`req-displayName-${index}`"
          class="block text-xs font-medium text-gray-600"
          >Display Name (UI)</label
        >
        <input
          type="text"
          :id="`req-displayName-${index}`"
          :value="editableRequirement.displayName"
          @input="
            updateField(
              'displayName',
              ($event.target as HTMLInputElement).value
            )
          "
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5"
        />
      </div>

      <div>
        <label
          :for="`req-name-${index}`"
          class="block text-xs font-medium text-gray-600"
          >SHARP Name / Description (Unique ID)</label
        >
        <input
          type="text"
          :id="`req-name-${index}`"
          :value="editableRequirement.name"
          @input="
            updateField('name', ($event.target as HTMLInputElement).value)
          "
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5"
        />
        <p class="text-xs text-gray-500 mt-0.5">
          Must match SHARP export column header for completion tracking.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label
            :for="`req-type-${index}`"
            class="block text-xs font-medium text-gray-600"
            >Type (PQS/Event)</label
          >
          <select
            :id="`req-type-${index}`"
            :value="editableRequirement.requirementType"
            @change="
              updateField(
                'requirementType',
                ($event.target as HTMLSelectElement)
                  .value as RequirementTypeInternal
              )
            "
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5"
          >
            <option value="PQS">PQS</option>
            <option value="Event">Event</option>
            <option value="OtherWaived">Other (Waived)</option>
          </select>
        </div>
        <div>
          <label
            :for="`req-rawSubType-${index}`"
            class="block text-xs font-medium text-gray-600"
            >SHARP Subtype (Orig.)</label
          >
          <input
            type="text"
            :id="`req-rawSubType-${index}`"
            :value="editableRequirement.rawSharpEventSubtype"
            @input="
              updateField(
                'rawSharpEventSubtype',
                ($event.target as HTMLInputElement).value
              )
            "
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5"
            placeholder="e.g., FLIGHT, SYSTEM"
          />
        </div>
      </div>

      <div>
        <label
          :for="`req-difficulty-${index}`"
          class="block text-xs font-medium text-gray-600"
          >Difficulty (Optional)</label
        >
        <input
          type="number"
          min="0"
          :id="`req-difficulty-${index}`"
          :value="editableRequirement.difficulty"
          @input="
            updateField(
              'difficulty',
              parseInt(($event.target as HTMLInputElement).value) || undefined
            )
          "
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5"
        />
      </div>

      <div>
        <label
          :for="`req-acadHours-${index}`"
          class="block text-xs font-medium text-gray-600"
          >Academic Hrs (Opt.)</label
        >
        <input
          type="number"
          min="0"
          step="0.1"
          :id="`req-acadHours-${index}`"
          :value="editableRequirement.academicHours"
          @input="
            updateField(
              'academicHours',
              parseFloat(($event.target as HTMLInputElement).value) || null
            )
          "
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-1.5"
        />
      </div>
      <div
        class="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 items-center pt-2"
      >
        <label
          :for="`req-mandatory-${index}`"
          class="flex items-center space-x-2 text-sm"
        >
          <input
            type="checkbox"
            :id="`req-mandatory-${index}`"
            :checked="editableRequirement.isMandatory"
            @change="
              updateField(
                'isMandatory',
                ($event.target as HTMLInputElement).checked
              )
            "
            class="rounded text-indigo-600"
          />
          <span>Is Mandatory</span>
        </label>
        <label
          :for="`req-waived-${index}`"
          class="flex items-center space-x-2 text-sm"
        >
          <input
            type="checkbox"
            :id="`req-waived-${index}`"
            :checked="editableRequirement.isDefaultWaived"
            @change="
              updateField(
                'isDefaultWaived',
                ($event.target as HTMLInputElement).checked
              )
            "
            class="rounded text-indigo-600"
          />
          <span>Default Waived</span>
        </label>
      </div>
    </div>

    <div class="mt-4 pt-3 border-t">
      <h5 class="text-sm font-semibold text-gray-700 mb-1">
        Prerequisites (IDs/Names):
      </h5>
      <div
        v-if="
          editableRequirement.prerequisites &&
          editableRequirement.prerequisites.length > 0
        "
        class="mb-2"
      >
        <span
          v-for="(prereqId, pIdx) in editableRequirement.prerequisites"
          :key="`prereq-${index}-${pIdx}`"
          class="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700 mr-1 mb-1"
        >
          {{ prereqId }}
        </span>
      </div>
      <p v-else class="text-xs text-gray-500 mb-2">None specified.</p>
      <button
        type="button"
        @click="openPrerequisiteEditor"
        class="text-xs px-3 py-1 border border-indigo-500 text-indigo-600 rounded hover:bg-indigo-50"
      >
        Edit Prerequisites (Stub)
      </button>
    </div>

    <div class="mt-3 text-right">
      <button
        type="button"
        @click="handleRemoveRequirement"
        class="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Remove This Item
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type PropType, defineEmits, defineProps } from "vue";
import {
  type Requirement,
  type RequirementTypeInternal,
} from "@/types/syllabiTypes"; // Using @ alias
import { useUiStore } from "@/stores/uiStore";

const props = defineProps({
  requirement: {
    type: Object as PropType<Requirement>,
    required: true,
  },
  index: {
    // For unique IDs in template
    type: Number,
    required: true,
  },
  // allPossiblePrerequisites: { // This would be passed from parent for the editor
  //   type: Array as PropType<Requirement[]>,
  //   default: () => []
  // }
});

const emit = defineEmits<{
  (e: "update:requirement", updatedRequirement: Requirement): void;
  (e: "remove:requirement", requirementId: string): void;
  (e: "edit-prerequisites", requirementId: string): void; // To open a more complex editor
}>();

const uiStore = useUiStore();

// Create a local reactive copy for editing to avoid direct prop mutation
const editableRequirement = ref<Requirement>({ ...props.requirement });

// Watch for prop changes if the parent might pass a new requirement object
watch(
  () => props.requirement,
  (newVal) => {
    editableRequirement.value = { ...newVal };
  },
  { deep: true }
);

const updateField = <K extends keyof Requirement>(
  field: K,
  value: Requirement[K]
) => {
  editableRequirement.value = { ...editableRequirement.value, [field]: value };
  // Emit the full updated requirement so the parent (SyllabusDetailForm) can update its list
  // and eventually the store (and set the dirty flag)
  emit("update:requirement", editableRequirement.value);
};

const openPrerequisiteEditor = () => {
  uiStore.addNotification({
    message: `Prerequisite editor for "${props.requirement.name}" to be implemented.`,
    type: "info",
  });
  // This would typically open another modal or a dedicated UI section
  // For now, we just emit an event that the parent (SyllabusDetailForm) could handle
  emit("edit-prerequisites", props.requirement.id);
};

const handleRemoveRequirement = () => {
  emit("remove:requirement", props.requirement.id);
};
</script>
