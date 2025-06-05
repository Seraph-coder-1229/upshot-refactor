<template>
  <div class="p-6 bg-gray-100 rounded-lg shadow-xl max-w-2xl mx-auto">
    <h3 class="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
      {{ isNew ? "Create New Syllabus" : "Edit Syllabus Details" }}
    </h3>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label
          for="syllabus-name"
          class="block text-sm font-medium text-gray-700 mb-1"
          >Syllabus Name/Title:</label
        >
        <input
          type="text"
          id="syllabus-name"
          v-model="editableSyllabus.name"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          placeholder="e.g., PPC P8 PQS 2025 Rev A"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            for="syllabus-position"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Position:</label
          >
          <select
            id="syllabus-position"
            v-model="editableSyllabus.position"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          >
            <option disabled value="">Select Position</option>
            <option>PILOT</option>
            <option>NFO</option>
            <option>EWO</option>
            <option>AAW</option>
            <option>OTHER</option>
          </select>
        </div>
        <div>
          <label
            for="syllabus-level"
            class="block text-sm font-medium text-gray-700 mb-1"
            >ACTC Level:</label
          >
          <select
            id="syllabus-level"
            v-model.number="editableSyllabus.level"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          >
            <option disabled :value="0">Select Level</option>
            <option :value="200">200</option>
            <option :value="300">300</option>
            <option :value="400">400</option>
          </select>
        </div>
        <div>
          <label
            for="syllabus-year"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Year:</label
          >
          <input
            type="text"
            id="syllabus-year"
            v-model="editableSyllabus.year"
            required
            placeholder="e.g., 2025"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
        </div>
      </div>

      <div>
        <label
          for="syllabus-pqs-version"
          class="block text-sm font-medium text-gray-700 mb-1"
          >PQS Version Reference (Optional):</label
        >
        <input
          type="text"
          id="syllabus-pqs-version"
          v-model="editableSyllabus.pqsVersionRef"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          placeholder="Matches 'PQS VER' from SHARP records"
        />
      </div>

      <div class="border-t pt-6 space-y-4">
        <h4 class="text-md font-medium text-gray-700">
          Goal Timeline Settings (Months)
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Changed to 3 cols for better alignment with label */}
          <div class="md:col-span-1">
            {/* Added this to align label with input better */}
            <label
              for="syllabus-goal-start-offset"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Goal Start Offset (from upgrader start):</label
            >
          </div>
          <div class="md:col-span-2">
            {/* Input takes more space */}
            <input
              type="number"
              min="0"
              id="syllabus-goal-start-offset"
              v-model.number="editableSyllabus.goalStartMonthsOffset"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              placeholder="e.g., 0 or 12"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-1">
            <label
              for="syllabus-wing-goal"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Wing Goal (Total Duration):</label
            >
          </div>
          <div class="md:col-span-2">
            <input
              type="number"
              min="0"
              id="syllabus-wing-goal"
              v-model.number="editableSyllabus.wingGoalMonths"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-1">
            <label
              for="syllabus-squadron-goal"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Squadron Goal (Total Duration):</label
            >
          </div>
          <div class="md:col-span-2">
            <input
              type="number"
              min="0"
              id="syllabus-squadron-goal"
              v-model.number="editableSyllabus.squadronGoalMonths"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
        </div>
      </div>

      <div class="border-t pt-6 mt-6 space-y-4">
        <div class="flex justify-between items-center">
          <h4 class="text-lg font-medium text-gray-700">
            Requirements (PQS/Events)
          </h4>
          <button
            type="button"
            @click="addNewRequirement"
            class="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Add Requirement
          </button>
        </div>

        <div
          v-if="
            editableSyllabus.requirements &&
            editableSyllabus.requirements.length > 0
          "
          class="space-y-3 max-h-96 overflow-y-auto p-1 bg-gray-50 rounded"
        >
          <RequirementItem
            v-for="(req, index) in editableSyllabus.requirements"
            :key="req.id || `temp-req-${index}`"
            :requirement="req"
            :index="index"
            @update:requirement="updateRequirementInList(index, $event)"
            @remove:requirement="removeRequirementFromList(req.id, index)"
            @edit-prerequisites="openGlobalPrerequisiteEditor(req)"
          />
        </div>
        <p v-else class="text-sm text-gray-500 py-4 text-center">
          No requirements added yet for this syllabus. Click "Add Requirement"
          to start.
        </p>
      </div>

      <div class="flex justify-end space-x-3 pt-6 mt-6 border-t">
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ isNew ? "Create Syllabus" : "Save Syllabus Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, defineProps, defineEmits } from "vue"; // Removed defineProps, defineEmits as they are auto-imported in <script setup>
import {
  type Syllabus,
  type Requirement,
  type RequirementTypeInternal,
} from "@/types/syllabiTypes";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";
// import { useRouter } from "vue-router"; // Only if you navigate programmatically
import RequirementItem from "./RequirementItem.vue";

const props = defineProps<{
  syllabusId?: string | null;
  isNew: boolean;
}>();

const emit = defineEmits(["close-form", "syllabus-saved"]);

const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();
// const router = useRouter(); // Only if needed

// Define a more complete type for the form's local state, ensuring requirements is always an array
type EditableSyllabusFormType = Omit<Syllabus, "id" | "requirements"> & {
  id?: string; // id is optional for new syllabi before saving
  requirements: Requirement[]; // Ensure requirements is always present and an array
};

const getEmptySyllabusForm = (): EditableSyllabusFormType => ({
  name: "",
  position: "", // Default to empty or first available option
  level: 0, // Or a sensible default like 200. Needs to match a <option> value or be handled.
  year: new Date().getFullYear().toString(),
  pqsVersionRef: "",
  requirements: [], // Crucially initialize as an empty array
  wingGoalMonths: 0,
  squadronGoalMonths: 0,
  goalStartMonthsOffset: 0,
});

const editableSyllabus = ref<EditableSyllabusFormType>(getEmptySyllabusForm());

const availablePositions = computed(() => {
  // TODO: Replace with actual data source, e.g., from a constants file or syllabiStore.getAvailablePositions()
  return ["PILOT", "NFO", "EWO", "AAW", "OTHER"];
});

const populateForm = (id: string | null | undefined) => {
  if (!props.isNew && id) {
    const existingSyllabus = syllabiStore.getSyllabusById(id);
    if (existingSyllabus) {
      // Deep clone and ensure requirements is an array
      editableSyllabus.value = {
        ...JSON.parse(JSON.stringify(existingSyllabus)),
        requirements: existingSyllabus.requirements
          ? JSON.parse(JSON.stringify(existingSyllabus.requirements))
          : [],
      };
      // Ensure numeric fields that might be optional are correctly initialized if not present
      editableSyllabus.value.goalStartMonthsOffset =
        editableSyllabus.value.goalStartMonthsOffset || 0;
    } else {
      uiStore.addNotification({
        message: `Syllabus with ID ${id} not found for editing. Initializing new form.`,
        type: "error",
      });
      editableSyllabus.value = getEmptySyllabusForm(); // Fallback to empty form
    }
  } else if (props.isNew) {
    editableSyllabus.value = getEmptySyllabusForm();
  }
};

onMounted(() => {
  populateForm(props.syllabusId);
});

watch(
  () => props.syllabusId,
  (newId) => {
    populateForm(newId);
  }
);
watch(
  // Watch the isNew prop as well, if the form can switch modes
  () => props.isNew,
  (newIsNewValue, oldIsNewValue) => {
    if (newIsNewValue) {
      // If switched to 'new' mode
      editableSyllabus.value = getEmptySyllabusForm();
    } else if (props.syllabusId) {
      // If switched to 'edit' mode with an ID
      populateForm(props.syllabusId);
    }
    // If switching from new to edit without an ID immediately, it should wait for syllabusId prop
  }
);

const addNewRequirement = () => {
  // Ensure requirements array exists (it should due to initialization)
  if (!editableSyllabus.value.requirements) {
    editableSyllabus.value.requirements = [];
  }
  const newReqId = `NEW_REQ_${Date.now()}_${
    editableSyllabus.value.requirements.length
  }`;
  editableSyllabus.value.requirements.push({
    id: newReqId,
    name: "New Req - SHARP Name",
    displayName: "New Requirement",
    requirementType: "Event" as RequirementTypeInternal,
    prerequisites: [],
    isMandatory: true,
    isDefaultWaived: false,
    // Initialize other new Requirement fields here
    academicHours: 0,
    deviceHours: 0,
    flightHoursAssociated: 0,
    eventCreditValue: 0,
  });
  // Mark syllabus as dirty (parent form will handle overall dirty state for syllabus when saved)
};

const updateRequirementInList = (index: number, updatedReq: Requirement) => {
  if (
    editableSyllabus.value.requirements &&
    editableSyllabus.value.requirements[index]
  ) {
    editableSyllabus.value.requirements[index] = updatedReq;
  }
};

const removeRequirementFromList = (
  reqIdToRemove: string,
  indexFallback: number
) => {
  if (editableSyllabus.value.requirements) {
    const foundIndex = editableSyllabus.value.requirements.findIndex(
      (r) => r.id === reqIdToRemove
    );
    if (foundIndex !== -1) {
      editableSyllabus.value.requirements.splice(foundIndex, 1);
    } else if (
      typeof indexFallback === "number" &&
      editableSyllabus.value.requirements[indexFallback]?.id.startsWith(
        "NEW_REQ_"
      )
    ) {
      // Fallback for newly added items not yet having a persistent ID
      editableSyllabus.value.requirements.splice(indexFallback, 1);
    } else {
      console.warn(
        "Could not find requirement to remove by ID or fallback index:",
        reqIdToRemove,
        indexFallback
      );
    }
  }
};

const openGlobalPrerequisiteEditor = (requirement: Requirement) => {
  uiStore.addNotification({
    message: `Prerequisite editor for "${requirement.displayName}" (STUB).`,
    type: "info",
  });
  console.log("Stub: Editing prerequisites for:", requirement);
};

const handleSubmit = () => {
  if (
    !editableSyllabus.value.name ||
    !editableSyllabus.value.position ||
    !editableSyllabus.value.level || // Level 0 could be a valid input if allowed, adjust validation if needed
    !editableSyllabus.value.year
  ) {
    uiStore.addNotification({
      message:
        "Please fill in all required syllabus fields (Name, Position, Level, Year).",
      type: "error",
    });
    return;
  }

  // Ensure numeric fields are numbers
  const finalEditableSyllabus = editableSyllabus.value;
  finalEditableSyllabus.level = Number(finalEditableSyllabus.level) || 0; // Default to 0 if NaN
  finalEditableSyllabus.wingGoalMonths =
    Number(finalEditableSyllabus.wingGoalMonths) || 0;
  finalEditableSyllabus.squadronGoalMonths =
    Number(finalEditableSyllabus.squadronGoalMonths) || 0;
  finalEditableSyllabus.goalStartMonthsOffset =
    Number(finalEditableSyllabus.goalStartMonthsOffset) || 0;

  const syllabusToSave: Syllabus = {
    id: props.isNew ? `SYL-${Date.now()}` : props.syllabusId!, // Simpler new ID
    name: finalEditableSyllabus.name,
    position: finalEditableSyllabus.position,
    level: finalEditableSyllabus.level,
    year: finalEditableSyllabus.year,
    pqsVersionRef: finalEditableSyllabus.pqsVersionRef || undefined, // Ensure optional fields are handled
    requirements: finalEditableSyllabus.requirements || [], // Ensure requirements array exists
    wingGoalMonths: finalEditableSyllabus.wingGoalMonths,
    squadronGoalMonths: finalEditableSyllabus.squadronGoalMonths,
    goalStartMonthsOffset: finalEditableSyllabus.goalStartMonthsOffset || 0, // Default if undefined
  };

  if (props.isNew) {
    syllabiStore.addSyllabus(syllabusToSave);
    uiStore.addNotification({
      message: `Syllabus "${syllabusToSave.name}" created successfully.`,
      type: "success",
    });
  } else {
    syllabiStore.updateSyllabus(syllabusToSave.id, syllabusToSave);
    uiStore.addNotification({
      message: `Syllabus "${syllabusToSave.name}" updated successfully.`,
      type: "success",
    });
  }
  emit("syllabus-saved", syllabusToSave.id);
  emit("close-form");
};

const handleCancel = () => {
  emit("close-form");
};
</script>
