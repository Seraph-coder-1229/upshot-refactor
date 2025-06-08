<template>
  <div v-if="syllabus" class="flex h-full gap-x-8">
    <SyllabusLevelNav
      :syllabus="syllabus"
      :selectedLevel="selectedLevel"
      @level-selected="selectedLevel = $event"
    />

    <div class="flex-grow">
      <div v-if="!editingRequirement">
        <SyllabusRequirementsTable
          :requirements="requirementsForSelectedLevel"
          @edit-requirement="handleEditRequirement"
        />
      </div>
      <div v-else>
        <RequirementItem
          :requirement="editingRequirement"
          @update:requirement="saveRequirement"
          @cancel="cancelEditRequirement"
        />
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full text-gray-500">
    <p>Loading syllabus or syllabus not found...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { type Syllabus, type Requirement } from "@/types/syllabiTypes";

import SyllabusLevelNav from "@/components/specific/SyllabusManager/SyllabusLevelNav.vue";
import SyllabusRequirementsTable from "@/components/specific/SyllabusManager/SyllabusRequirementsTable.vue";
import RequirementItem from "@/components/specific/SyllabusManager/RequirementItem.vue";

const route = useRoute();
const syllabiStore = useSyllabiStore();

const syllabus = ref<Syllabus | null>(null);
const selectedLevel = ref<number>(0);
const editingRequirement = ref<Requirement | null>(null);

const requirementsForSelectedLevel = computed(() => {
  if (!syllabus.value) return [];
  return syllabus.value.requirements.filter(
    (r) => r.level === selectedLevel.value
  );
});

onMounted(() => {
  const syllabusId = route.params.id as string;
  const foundSyllabus = syllabiStore.getSyllabusById(syllabusId);
  if (foundSyllabus) {
    // Use a deep clone to prevent direct mutation of the store state
    syllabus.value = JSON.parse(JSON.stringify(foundSyllabus));
    if (syllabus.value) {
      selectedLevel.value = syllabus.value.baseLevel;
    }
  }
});

function handleEditRequirement(requirement: Requirement) {
  editingRequirement.value = { ...requirement };
}

function cancelEditRequirement() {
  editingRequirement.value = null;
}

function saveRequirement(updatedRequirement: Requirement) {
  if (!syllabus.value) return;

  // Find the index of the requirement to update
  const index = syllabus.value.requirements.findIndex(
    (r) => r.id === updatedRequirement.id
  );

  if (index !== -1) {
    // Update the requirement in our local copy of the syllabus
    syllabus.value.requirements[index] = updatedRequirement;

    // Call the existing store action to save the *entire* updated syllabus
    syllabiStore.updateSyllabus(syllabus.value.id, syllabus.value);
  }

  // Return to the table view
  editingRequirement.value = null;
}
</script>
