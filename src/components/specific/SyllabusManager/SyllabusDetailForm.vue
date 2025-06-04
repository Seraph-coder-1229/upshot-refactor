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
            <option disabled value="">Select Level</option>
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="syllabus-goal-start-offset"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Goal Start Offset (from upgrader start):</label
            >
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="syllabus-wing-goal"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Wing Goal (Total Duration):</label
            >
            <input
              type="number"
              min="0"
              id="syllabus-wing-goal"
              v-model.number="editableSyllabus.wingGoalMonths"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
          <div>
            <label
              for="syllabus-squadron-goal"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Squadron Goal (Total Duration):</label
            >
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

      <div class="flex justify-end space-x-3 pt-6 border-t">
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
          {{ isNew ? "Create Syllabus" : "Save Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, defineProps, defineEmits } from "vue";
import { type Syllabus } from "@/types/syllabiTypes"; // Using @ alias
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";
import { useRouter } from "vue-router"; // If you navigate after save/cancel

const props = defineProps<{
  syllabusId?: string | null; // Can be null if creating new
  isNew: boolean;
}>();

const emit = defineEmits(["close-form", "syllabus-saved"]);

const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();
const router = useRouter(); // Optional: for navigation

// Initialize editableSyllabus with a default structure
const getEmptySyllabusForm = (): Omit<Syllabus, "id" | "requirements"> & {
  requirements?: Syllabus["requirements"];
} => ({
  name: "",
  position: "",
  level: 0, // Or a sensible default like 200
  year: new Date().getFullYear().toString(),
  pqsVersionRef: "",
  // Requirements array will be managed separately or initialized empty for new syllabi
  requirements: [],
  wingGoalMonths: 0,
  squadronGoalMonths: 0,
  goalStartMonthsOffset: 0,
});

const editableSyllabus = ref<
  Omit<Syllabus, "id" | "requirements"> & {
    id?: string;
    requirements?: Syllabus["requirements"];
  }
>(getEmptySyllabusForm());

const availablePositions = computed(() => {
  // Ideally, this comes from a predefined list or a getter in syllabiStore
  return ["PILOT", "NFO", "EWO", "AAW", "OTHER_POSITION_STUB"];
});

onMounted(() => {
  if (!props.isNew && props.syllabusId) {
    const existingSyllabus = syllabiStore.getSyllabusById(props.syllabusId);
    if (existingSyllabus) {
      editableSyllabus.value = JSON.parse(JSON.stringify(existingSyllabus)); // Deep clone for editing
    } else {
      uiStore.addNotification({
        message: `Syllabus with ID ${props.syllabusId} not found.`,
        type: "error",
      });
      emit("close-form");
    }
  } else if (props.isNew) {
    editableSyllabus.value = getEmptySyllabusForm();
  }
});

// Watch for external changes to syllabusId if the component might be reused
watch(
  () => props.syllabusId,
  (newId) => {
    if (!props.isNew && newId) {
      const existingSyllabus = syllabiStore.getSyllabusById(newId);
      if (existingSyllabus) {
        editableSyllabus.value = JSON.parse(JSON.stringify(existingSyllabus));
      }
    } else if (props.isNew) {
      editableSyllabus.value = getEmptySyllabusForm();
    }
  }
);

const handleSubmit = () => {
  // Basic validation example
  if (
    !editableSyllabus.value.name ||
    !editableSyllabus.value.position ||
    !editableSyllabus.value.level ||
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
  editableSyllabus.value.level = Number(editableSyllabus.value.level) || 0;
  editableSyllabus.value.wingGoalMonths =
    Number(editableSyllabus.value.wingGoalMonths) || 0;
  editableSyllabus.value.squadronGoalMonths =
    Number(editableSyllabus.value.squadronGoalMonths) || 0;
  editableSyllabus.value.goalStartMonthsOffset =
    Number(editableSyllabus.value.goalStartMonthsOffset) || 0;

  // Construct the final syllabus object, ensuring requirements are handled.
  // For now, this form doesn't edit requirements directly, so we preserve existing ones if editing.
  const syllabusToSave: Syllabus = {
    ...editableSyllabus.value,
    id: props.isNew
      ? `SYL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      : props.syllabusId!, // Generate ID if new
    requirements: editableSyllabus.value.requirements || [], // Preserve or init requirements
  } as Syllabus; // Cast needed because editableSyllabus might miss 'id' or 'requirements' temporarily

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
  emit("close-form"); // Close form after save
};

const handleCancel = () => {
  emit("close-form");
};
</script>
