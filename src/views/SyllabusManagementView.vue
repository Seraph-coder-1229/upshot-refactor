<template>
  <div class="p-4">
    <SyllabusList
      @edit-syllabus="openEditForm"
      @add-new-syllabus="openNewForm"
    />

    <BaseModal :is-open="isFormVisible" @close="closeForm">
      <SyllabusDetailForm
        v-if="isFormVisible"
        :is-new="isNewSyllabus"
        :syllabus-id="editingSyllabusId"
        @close-form="closeForm"
        @syllabus-saved="handleSyllabusSaved"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SyllabusList from "@/components/specific/SyllabusManager/SyllabusList.vue";
import SyllabusDetailForm from "@/components/specific/SyllabusManager/SyllabusDetailForm.vue";
import BaseModal from "@/components/ui/BaseModal.vue"; // Assuming you have a BaseModal component

const isFormVisible = ref(false);
const isNewSyllabus = ref(false);
const editingSyllabusId = ref<string | null>(null);

const openEditForm = (syllabusId: string) => {
  editingSyllabusId.value = syllabusId;
  isNewSyllabus.value = false;
  isFormVisible.value = true;
};

const openNewForm = () => {
  editingSyllabusId.value = null;
  isNewSyllabus.value = true;
  isFormVisible.value = true;
};

const closeForm = () => {
  isFormVisible.value = false;
  editingSyllabusId.value = null;
};

const handleSyllabusSaved = (savedSyllabusId: string) => {
  // Optionally refresh list or navigate
  closeForm();
};
</script>
