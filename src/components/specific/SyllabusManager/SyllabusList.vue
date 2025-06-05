<template>
  <div class="p-6 bg-white rounded-lg shadow-md space-y-6">
    <div
      class="flex flex-wrap justify-between items-center border-b pb-3 mb-4 gap-4"
    >
      <h2 class="text-2xl font-semibold text-gray-800">Syllabus Management</h2>
      <div class="flex flex-wrap gap-2">
        <button
          @click="handleImportSharpSyllabus"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Import SHARP Syllabus Export (.xlsx)
        </button>
        <input
          type="file"
          ref="sharpSyllabusFileInput"
          @change="onSharpSyllabusFileSelected"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          class="hidden"
        />
        <button
          @click="handleAddManualSyllabus"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Syllabus Manually (Stub)
        </button>
      </div>
    </div>

    <div v-if="syllabiStore.isLoading" class="text-center text-gray-500 py-5">
      <p>Loading syllabi...</p>
    </div>

    <div
      v-if="!syllabiStore.isLoading && syllabiStore.allSyllabi.length === 0"
      class="text-center text-gray-500 py-10 border-2 border-dashed border-gray-300 rounded-lg"
    >
      <p class="mb-2">No syllabi loaded.</p>
      <p class="text-sm">
        Please import a SHARP Syllabus Export or ensure your
        <code>user_syllabi.js</code> file is correctly placed in the
        <code>./syllabi/</code> folder and reload.
      </p>
    </div>

    <div v-else-if="!syllabiStore.isLoading" class="space-y-4">
      <div
        v-for="syllabus in syllabiStore.allSyllabi"
        :key="syllabus.id"
        class="p-4 border rounded-lg bg-gray-50 hover:shadow-lg transition-shadow duration-150 ease-in-out"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start">
          <div class="mb-2 sm:mb-0">
            <h3 class="text-lg font-semibold text-indigo-700">
              {{ syllabus.name }} ({{ syllabus.year }})
            </h3>
            <p class="text-sm text-gray-600">
              Position:
              <span class="font-medium">{{ syllabus.position }}</span> | Level:
              <span class="font-medium">{{ syllabus.level }}</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">
              ID:
              <code class="text-xs bg-gray-200 p-1 rounded">{{
                syllabus.id
              }}</code>
              | PQS Version Ref:
              <span class="font-medium">{{
                syllabus.pqsVersionRef || "N/A"
              }}</span>
            </p>
            <p class="text-xs text-gray-500">
              Requirements: {{ syllabus.requirements.length }} items
            </p>
          </div>
          <div
            class="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0 self-start sm:self-center"
          >
            <button
              @click="handleEditSyllabus(syllabus.id)"
              class="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600"
            >
              Edit (Stub)
            </button>
            <button
              @click="handleDeleteSyllabus(syllabus.id)"
              class="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="syllabiStore.allSyllabi.length > 0" class="mt-8 border-t pt-6">
      <button
        @click="handleDownloadSyllabi"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      >
        Download Current Syllabi (.js)
      </button>
      <p
        v-if="syllabiStore.isDirty"
        class="mt-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md"
      >
        Syllabi have unsaved changes. Download to persist for your next session.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from "vue";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";

const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();

// Define the events this component can emit
const emit = defineEmits<{
  (e: "add-new-syllabus"): void;
  (e: "edit-syllabus", syllabusId: string): void;
}>();

const sharpSyllabusFileInput = ref<HTMLInputElement | null>(null);

const handleImportSharpSyllabus = () => {
  sharpSyllabusFileInput.value?.click();
};

const onSharpSyllabusFileSelected = async (event: Event) => {
  // ... (same as before)
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    await syllabiStore.importSyllabiFromSharpExport(file);
    input.value = "";
  }
};

const handleAddManualSyllabus = () => {
  // Instead of just a notification, emit an event
  emit("add-new-syllabus");
  // uiStore.addNotification({ message: 'Manual syllabus creation to be implemented.', type: 'info' });
};

const handleEditSyllabus = (syllabusId: string) => {
  console.log("SyllabusList emitting edit-syllabus for ID:", syllabusId); // DEBUG
  emit("edit-syllabus", syllabusId);
};

const handleDeleteSyllabus = (syllabusId: string) => {
  if (
    confirm(
      `Are you sure you want to delete syllabus ID: ${syllabusId}? This action cannot be undone from the UI directly and will be permanent if you download this syllabi set.`
    )
  ) {
    syllabiStore.removeSyllabus(syllabusId);
    uiStore.addNotification({
      message: `Syllabus ${syllabusId} deleted.`,
      type: "success",
    });
  }
};

const handleDownloadSyllabi = () => {
  syllabiStore.downloadSyllabi();
};
</script>
