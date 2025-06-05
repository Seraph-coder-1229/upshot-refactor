// src/views/SyllabusManagementView.vue

<template>
  <div class="syllabus-management-view container mx-auto py-4">
    <SyllabusList
      @edit-syllabus="openEditSyllabusForm"
      @add-new-syllabus="openNewSyllabusForm"
    />

    <BaseModal
      v-if="isSyllabusFormVisible"
      :is-open="isSyllabusFormVisible"
      @close="closeSyllabusForm"
      title="Syllabus Details"
      size="2xl"
    >
      <template #body>
        <SyllabusDetailForm
          :is-new="isNewSyllabusMode"
          :syllabus-id="selectedSyllabusIdForEdit"
          @close-form="closeSyllabusForm"
          @syllabus-saved="handleSyllabusFormSaved"
        />
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SyllabusList from "@/components/specific/SyllabusManager/SyllabusList.vue"; // Adjust path if not using @ alias
import SyllabusDetailForm from "@/components/specific/SyllabusManager/SyllabusDetailForm.vue"; // Adjust path
import BaseModal from "@/components/ui/BaseModal.vue"; // Adjust path

// --- Declare your reactive state variables here ---
const isSyllabusFormVisible = ref(false);
const isNewSyllabusMode = ref(false);
const selectedSyllabusIdForEdit = ref<string | null>(null);
// --- End of reactive state declarations ---

const openEditSyllabusForm = (syllabusId: string) => {
  console.log("View: Opening edit form for syllabusId:", syllabusId);
  selectedSyllabusIdForEdit.value = syllabusId;
  isNewSyllabusMode.value = false;
  // Before making visible, ensure the props are correct for the form
  console.log(
    "View: Props to be passed -> isNew:",
    isNewSyllabusMode.value,
    "id:",
    selectedSyllabusIdForEdit.value
  );
  isSyllabusFormVisible.value = true;
};

const openNewSyllabusForm = () => {
  selectedSyllabusIdForEdit.value = null; // No ID when creating new
  isNewSyllabusMode.value = true;
  isSyllabusFormVisible.value = true;
};

const closeSyllabusForm = () => {
  isSyllabusFormVisible.value = false;
  selectedSyllabusIdForEdit.value = null; // Clear ID when form closes
};

const handleSyllabusFormSaved = (/* savedSyllabusId: string */) => {
  // Optionally refresh list or perform other actions
  closeSyllabusForm();
  // Potentially add a success notification via uiStore
};
</script>

<style scoped>
/* Add styles specific to this view if needed */
</style>
