<template>
  <div v-if="upgrader" class="p-4 md:p-6 lg:p-8">
    <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">
        Edit Personnel: {{ upgrader.displayName }}
      </h1>

      <form @submit.prevent="saveChanges" class="space-y-8">
        <fieldset class="space-y-6">
          <legend class="text-lg font-medium text-gray-900">
            Core Details
          </legend>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="rank" class="block text-sm font-medium text-gray-700"
                >Rank</label
              >
              <input
                type="text"
                v-model="editableUpgrader.rank"
                id="rank"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                for="displayName"
                class="block text-sm font-medium text-gray-700"
                >Display Name</label
              >
              <input
                type="text"
                v-model="editableUpgrader.displayName"
                id="displayName"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                for="startDate"
                class="block text-sm font-medium text-gray-700"
                >Start Date</label
              >
              <input
                type="date"
                :value="formattedStartDate"
                @input="updateStartDate"
                id="startDate"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </fieldset>

        <fieldset class="space-y-6">
          <legend class="text-lg font-medium text-gray-900">
            Syllabus & Qualification
          </legend>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                for="assignedPosition"
                class="block text-sm font-medium text-gray-700"
                >Assigned Position</label
              >
              <input
                type="text"
                v-model="editableUpgrader.assignedPosition"
                id="assignedPosition"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                for="targetQualificationLevel"
                class="block text-sm font-medium text-gray-700"
                >Target Qualification Level</label
              >
              <select
                v-model.number="editableUpgrader.targetQualificationLevel"
                id="targetQualificationLevel"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option>100</option>
                <option>200</option>
                <option>300</option>
                <option>400</option>
              </select>
            </div>
            <div>
              <label
                for="assignedSyllabusYear"
                class="block text-sm font-medium text-gray-700"
                >Default Syllabus Year</label
              >
              <input
                type="text"
                v-model="editableUpgrader.assignedSyllabusYear"
                id="assignedSyllabusYear"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div class="space-y-4 pt-4">
            <h3 class="text-md font-medium text-gray-800">
              Level-Specific Syllabus Years (Optional)
            </h3>
            <div
              v-if="editableUpgrader.levelSyllabusYears"
              class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4"
            >
              <div>
                <label
                  for="level-200-year"
                  class="block text-xs font-medium text-gray-600"
                  >Level 200</label
                >
                <select
                  v-model="editableUpgrader.levelSyllabusYears['200']"
                  id="level-200-year"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Use Default --</option>
                  <option
                    v-for="year in availableSyllabusYears"
                    :key="year"
                    :value="year"
                  >
                    {{ year }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  for="level-300-year"
                  class="block text-xs font-medium text-gray-600"
                  >Level 300</label
                >
                <select
                  v-model="editableUpgrader.levelSyllabusYears['300']"
                  id="level-300-year"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Use Default --</option>
                  <option
                    v-for="year in availableSyllabusYears"
                    :key="year"
                    :value="year"
                  >
                    {{ year }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  for="level-400-year"
                  class="block text-xs font-medium text-gray-600"
                  >Level 400</label
                >
                <select
                  v-model="editableUpgrader.levelSyllabusYears['400']"
                  id="level-400-year"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Use Default --</option>
                  <option
                    v-for="year in availableSyllabusYears"
                    :key="year"
                    :value="year"
                  >
                    {{ year }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex items-start pt-2">
            <div class="flex h-5 items-center">
              <input
                id="onWaiver"
                v-model="editableUpgrader.onWaiver"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="onWaiver" class="font-medium text-gray-700"
                >On Waiver</label
              >
              <p class="text-gray-500">Is this upgrader on a waiver?</p>
            </div>
          </div>
        </fieldset>

        <div class="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            @click="downloadRoster"
            class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Download Roster
          </button>
          <button
            type="submit"
            class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, defineProps } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";
import { downloadPersonnelData } from "@/core/excelProcessorServices/personnelProcessorService";
import type { Upgrader } from "@/types/personnelTypes";

const props = defineProps<{ id: string }>();
const personnelStore = usePersonnelStore();
const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();

const upgrader = ref<Upgrader | null>(null);
const editableUpgrader = ref<Partial<Upgrader>>({ levelSyllabusYears: {} });

const availableSyllabusYears = computed(() => {
  if (!editableUpgrader.value.assignedPosition) return [];
  return syllabiStore.getSyllabusYearsForPosition(
    editableUpgrader.value.assignedPosition
  );
});

const findUpgrader = (lookupId: string) => {
  const foundUpgrader = personnelStore.getPersonnelById(lookupId);
  if (foundUpgrader) {
    upgrader.value = foundUpgrader;
    editableUpgrader.value = JSON.parse(JSON.stringify(foundUpgrader));
    if (!editableUpgrader.value.levelSyllabusYears) {
      editableUpgrader.value.levelSyllabusYears = {};
    }
  } else {
    upgrader.value = null;
    uiStore.addNotification({
      message: `Could not find upgrader with ID: ${lookupId}`,
      type: "error",
    });
  }
};

onMounted(() => {
  findUpgrader(props.id);
});

const formattedStartDate = computed(() => {
  if (!editableUpgrader.value.startDate) return "";
  const date = new Date(editableUpgrader.value.startDate);
  return date.toISOString().split("T")[0];
});

const updateStartDate = (event: Event) => {
  const target = event.target as HTMLInputElement;
  editableUpgrader.value.startDate = new Date(target.value);
};

const saveChanges = () => {
  if (upgrader.value && editableUpgrader.value) {
    const updatedData: Upgrader = {
      ...upgrader.value,
      ...editableUpgrader.value,
      startDate: new Date(
        editableUpgrader.value.startDate || upgrader.value.startDate
      ),
    };
    personnelStore.updatePersonnel(updatedData);
    uiStore.addNotification({
      message: "Personnel data updated successfully.",
      type: "success",
    });
  }
};

const downloadRoster = () => {
  downloadPersonnelData(personnelStore.allPersonnel);
};

watch(
  () => props.id,
  (newId) => {
    if (typeof newId === "string") {
      findUpgrader(newId);
    }
  }
);
</script>
