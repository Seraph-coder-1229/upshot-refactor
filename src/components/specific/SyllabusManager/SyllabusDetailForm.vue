<template>
  <div class="p-2 bg-gray-100 rounded-lg shadow-xl h-full flex flex-col">
    <h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
      {{ isNew ? "Create New Syllabus" : "Edit Syllabus Details" }}
    </h3>

    <form
      @submit.prevent="handleSubmit"
      class="space-y-4 flex-grow flex flex-col"
    >
      <div class="space-y-4"></div>

      <div class="border-t pt-4 mt-4 space-y-2 flex-grow flex flex-col">
        <div class="flex justify-between items-center">
          <h4 class="text-lg font-medium text-gray-700">Requirements</h4>
          <button
            type="button"
            @click="addNewRequirement"
            class="px-3 py-1.5 border rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Add Requirement
          </button>
        </div>

        <div class="flex-grow overflow-y-auto border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200"></table>
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-4 mt-4 border-t">
        <button
          type="button"
          @click="$emit('close-form')"
          class="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {{ isNew ? "Create Syllabus" : "Save Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, defineProps, defineEmits } from "vue";
import {
  type Syllabus,
  type Requirement,
  RequirementType,
} from "@/types/syllabiTypes";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";

const props = defineProps<{
  syllabusId?: string | null;
  isNew: boolean;
}>();

const emit = defineEmits(["close-form", "syllabus-saved"]);
const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();
const editableSyllabus = ref<Syllabus>(getEmptySyllabus());

function getEmptySyllabus(): Syllabus {
  return {
    id: `NEW-${Date.now()}`,
    name: "",
    displayName: "",
    position: "",
    baseLevel: 200,
    year: new Date().getFullYear().toString(),
    requirements: [],
    masterSyllabusIdentifier: null,
  };
}

// --- ALL THE MISSING FUNCTIONS ARE NOW HERE ---

function populateForm(id: string | null | undefined) {
  if (!props.isNew && id) {
    const existing = syllabiStore.getSyllabusById(id);
    if (existing) {
      editableSyllabus.value = JSON.parse(JSON.stringify(existing));
    }
  } else {
    editableSyllabus.value = getEmptySyllabus();
  }
}

onMounted(() => populateForm(props.syllabusId));
watch(
  () => props.syllabusId,
  (newId) => populateForm(newId)
);

function addNewRequirement() {
  const newReq: Requirement = {
    id: `NEW_REQ_${Date.now()}`,
    name: "New Requirement - Long Name",
    displayName: "New Req",
    level: editableSyllabus.value.baseLevel,
    type: RequirementType.Event,
  };
  editableSyllabus.value.requirements.push(newReq);
}

function removeRequirementFromList(reqId: string) {
  const index = editableSyllabus.value.requirements.findIndex(
    (r) => r.id === reqId
  );
  if (index !== -1) {
    editableSyllabus.value.requirements.splice(index, 1);
  }
}

function handleSubmit() {
  if (!editableSyllabus.value.name) {
    uiStore.addNotification({
      message: "Syllabus Name is required.",
      type: "error",
    });
    return;
  }

  const syllabusToSave = editableSyllabus.value;
  if (props.isNew) {
    syllabiStore.addSyllabus(syllabusToSave);
  } else {
    syllabiStore.updateSyllabus(syllabusToSave.id, syllabusToSave);
  }
  emit("syllabus-saved", syllabusToSave.id);
}
</script>
