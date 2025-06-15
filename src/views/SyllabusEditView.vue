<template>
  <div class="flex flex-col h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
    <header v-if="syllabus" class="mb-6 pb-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ syllabus.displayName }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Editing {{ syllabus.position }} Syllabus ({{ syllabus.year }})
          </p>
        </div>
        <router-link
          :to="{ name: 'SyllabusManagement' }"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-2" />
          Back to Management
        </router-link>
      </div>
    </header>

    <div
      v-if="syllabus"
      class="flex flex-grow overflow-hidden bg-white rounded-lg shadow"
    >
      <aside class="w-64 flex-shrink-0 border-r border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
        <div class="space-y-6">
          <div>
            <label
              for="level-filter"
              class="block text-sm font-medium text-gray-700"
              >Level</label
            >
            <select
              id="level-filter"
              v-model="selectedLevel"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option :value="null">All Levels</option>
              <option
                v-for="level in availableLevels"
                :key="level"
                :value="level"
              >
                {{ level }}
              </option>
            </select>
          </div>
          <div>
            <label
              for="type-filter"
              class="block text-sm font-medium text-gray-700"
              >Type</label
            >
            <select
              id="type-filter"
              v-model="selectedType"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option :value="null">All Types</option>
              <option v-for="type in availableTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
          <div>
            <label
              for="subtype-filter"
              class="block text-sm font-medium text-gray-700"
              >SubType</label
            >
            <select
              id="subtype-filter"
              v-model="selectedSubType"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option :value="null">All SubTypes</option>
              <option
                v-for="subType in availableSubTypes"
                :key="subType"
                :value="subType"
              >
                {{ subType }}
              </option>
            </select>
          </div>

          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
            <div class="space-y-2">
              <button
                @click="waiveAllFiltered"
                class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                :disabled="filteredRequirements.length === 0"
                title="Mark all requirements currently visible in the table as waived"
              >
                Waive All Displayed ({{ filteredRequirements.length }})
              </button>
              <button
                @click="unwaiveAllFiltered"
                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                :disabled="filteredRequirements.length === 0"
                title="Mark all requirements currently visible in the table as required"
              >
                Unwaive All Displayed ({{ filteredRequirements.length }})
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex-1 p-6 overflow-y-auto">
        <Transition name="fade" mode="out-in">
          <div v-if="!editingRequirement" key="table">
            <SyllabusRequirementsTable
              :requirements="filteredRequirements"
              @edit-requirement="handleEditRequirement"
            />
          </div>
          <RequirementItem
            v-else
            :requirement="editingRequirement"
            @update:requirement="saveRequirement"
            @cancel="cancelEditRequirement"
            :key="editingRequirement.id"
          />
        </Transition>
      </main>
    </div>

    <div v-else class="flex items-center justify-center h-full text-gray-500">
      <p>Loading syllabus...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useSyllabiStore } from "@/stores/syllabiStore";
import {
  type Syllabus,
  type Requirement,
  RequirementType,
} from "@/types/syllabiTypes";
import { getUniqueValues } from "@/utils/arrayUtils";
import SyllabusRequirementsTable from "@/components/specific/SyllabusManager/SyllabusRequirementsTable.vue";
import RequirementItem from "@/components/specific/SyllabusManager/RequirementItem.vue";
import { ArrowLeftIcon } from "@heroicons/vue/24/solid";

const route = useRoute();
const syllabiStore = useSyllabiStore();

const syllabus = ref<Syllabus | null>(null);
const selectedLevel = ref<string | null>(null);
const selectedType = ref<RequirementType | null>(null);
const selectedSubType = ref<string | null>(null);
const editingRequirement = ref<Requirement | null>(null);

const availableLevels = computed(() => {
  if (!syllabus.value) return [];
  return getUniqueValues(
    syllabus.value.requirements.map((r) => r.level.toString())
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
});

const availableTypes = computed(() => {
  if (!syllabus.value) return [];
  return getUniqueValues(syllabus.value.requirements.map((r) => r.type)).sort();
});

const availableSubTypes = computed(() => {
  if (!syllabus.value) return [];
  const subTypes = syllabus.value.requirements
    .map((r) => r.rawSharpEventSubtype)
    .filter((subType): subType is string => !!subType);
  return getUniqueValues(subTypes).sort();
});

const filteredRequirements = computed(() => {
  if (!syllabus.value) return [];
  return syllabus.value.requirements.filter((req) => {
    const levelMatch = selectedLevel.value
      ? req.level.toString() === selectedLevel.value
      : true;
    const typeMatch = selectedType.value
      ? req.type === selectedType.value
      : true;
    const subTypeMatch = selectedSubType.value
      ? req.rawSharpEventSubtype === selectedSubType.value
      : true;
    return levelMatch && typeMatch && subTypeMatch;
  });
});

onMounted(() => {
  const syllabusId = route.params.id as string;
  const foundSyllabus = syllabiStore.getSyllabusById(syllabusId);
  if (foundSyllabus) {
    syllabus.value = JSON.parse(JSON.stringify(foundSyllabus));
    if (syllabus.value && syllabus.value.baseLevel) {
      selectedLevel.value = syllabus.value.baseLevel.toString();
    }
  } else {
    console.error(
      `Syllabus with ID "${syllabusId}" was not found in the store.`
    );
  }
});

const waiveAllFiltered = () => {
  if (!syllabus.value) return;
  const visibleIds = new Set(filteredRequirements.value.map((r) => r.id));
  const updatedRequirements = syllabus.value.requirements.map((req) => {
    if (visibleIds.has(req.id)) {
      return { ...req, isDefaultWaived: true };
    }
    return req;
  });
  syllabus.value.requirements = updatedRequirements;
  syllabiStore.updateSyllabus(syllabus.value.id, syllabus.value);
};

// NEW: Function to unwaive all filtered requirements
const unwaiveAllFiltered = () => {
  if (!syllabus.value) return;
  const visibleIds = new Set(filteredRequirements.value.map((r) => r.id));
  const updatedRequirements = syllabus.value.requirements.map((req) => {
    if (visibleIds.has(req.id)) {
      // Set isDefaultWaived to false for visible items
      return { ...req, isDefaultWaived: false };
    }
    return req;
  });
  syllabus.value.requirements = updatedRequirements;
  syllabiStore.updateSyllabus(syllabus.value.id, syllabus.value);
};

function handleEditRequirement(requirement: Requirement) {
  editingRequirement.value = { ...requirement };
}
function cancelEditRequirement() {
  editingRequirement.value = null;
}
function saveRequirement(updatedRequirement: Requirement) {
  if (!syllabus.value) return;
  const index = syllabus.value.requirements.findIndex(
    (r) => r.id === updatedRequirement.id
  );
  if (index !== -1) {
    syllabus.value.requirements[index] = updatedRequirement;
    syllabiStore.updateSyllabus(syllabus.value.id, syllabus.value);
  }
  editingRequirement.value = null;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
