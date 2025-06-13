<template>
  <div class="p-4 space-y-6">
    <header class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Syllabus Management</h1>
        <p class="text-gray-600">
          Manage existing syllabi or upload a new one.
        </p>
      </div>
      <button
        @click="handleDownloadSyllabi"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        :disabled="!syllabiStore.isDirty"
        title="Download all current syllabi as a user_syllabi.js file"
      >
        Download Syllabi
      </button>
    </header>

    <SyllabusUploader @syllabus-parsed="handleSyllabusParsed" />

    <SyllabusList :syllabi="allSyllabi" @edit="handleEditExistingSyllabus" />

    <SyllabusUploadConfirmation
      :is-open="isConfirmationModalOpen"
      :syllabus="pendingSyllabus"
      @accept="handleAcceptSyllabus"
      @edit="handleEditPendingSyllabus"
      @deny="handleDenySyllabus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSyllabiStore } from "@/stores/syllabiStore";
import SyllabusUploader from "@/components/specific/SyllabusManager/SyllabusUploader.vue";
import SyllabusList from "@/components/specific/SyllabusManager/SyllabusList.vue";
import SyllabusUploadConfirmation from "@/components/specific/SyllabusManager/SyllabusUploadConfirmation.vue";
import type { Syllabus } from "@/types/syllabiTypes";
import { fileHandlerService } from "@/core/fileHandlerService";

const router = useRouter();
const syllabiStore = useSyllabiStore();
const allSyllabi = computed(() => syllabiStore.allSyllabi);

const isConfirmationModalOpen = ref(false);
const pendingSyllabus = ref<Syllabus | null>(null);

const handleSyllabusParsed = (newSyllabus: Syllabus) => {
  pendingSyllabus.value = newSyllabus;
  isConfirmationModalOpen.value = true;
};

const handleAcceptSyllabus = () => {
  if (pendingSyllabus.value) {
    syllabiStore.addSyllabus(pendingSyllabus.value);
  }
  resetFlow();
};

const handleEditPendingSyllabus = () => {
  if (pendingSyllabus.value) {
    // Temporarily add to store without making it permanent, so editor can find it
    // A more robust solution might use a dedicated "pendingEdit" state
    const tempId = syllabiStore.addSyllabus(pendingSyllabus.value);
    router.push({ name: "SyllabusEdit", params: { id: tempId } });
  }
  resetFlow();
};

const handleEditExistingSyllabus = (syllabusId: string) => {
  router.push({ name: "SyllabusEdit", params: { id: syllabusId } });
};

const handleDenySyllabus = () => {
  resetFlow();
};

const resetFlow = () => {
  isConfirmationModalOpen.value = false;
  pendingSyllabus.value = null;
};

const handleDownloadSyllabi = () => {
  fileHandlerService.downloadSyllabi(syllabiStore.allSyllabi);
};
</script>
