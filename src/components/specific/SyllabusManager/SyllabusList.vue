<template>
  <div class="p-6 bg-white rounded-lg shadow-md space-y-6">
    <div
      class="flex flex-wrap justify-between items-center border-b pb-3 mb-4 gap-4"
    >
      <h2 class="text-2xl font-semibold text-gray-800">Syllabus Management</h2>
      <div class="flex flex-wrap gap-2">
        <button
          @click="handleImportSharpSyllabus"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Import SHARP Syllabus (.xlsx)
        </button>
        <input
          type="file"
          ref="sharpSyllabusFileInput"
          @change="onSharpSyllabusFileSelected"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          class="hidden"
        />
        <button
          @click="handleAddManualSyllabus"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Add New Syllabus Manually
        </button>
      </div>
    </div>

    <div v-if="syllabiStore.isLoading" class="text-center text-gray-500 py-5">
      <p>Loading syllabi...</p>
    </div>

    <div
      v-else-if="
        !syllabiStore.isLoading && syllabiStore.allSyllabi.length === 0
      "
      class="text-center text-gray-500 py-10 border-2 border-dashed border-gray-300 rounded-lg"
    >
      <p class="mb-2">No syllabi loaded.</p>
      <p class="text-sm">Use the import button to load a syllabus file.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="syllabus in syllabiStore.allSyllabi"
        :key="syllabus.id"
        class="p-4 border rounded-lg bg-gray-50 hover:shadow-lg transition-shadow"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-start gap-4"
        >
          <div class="flex-grow">
            <h3 class="text-lg font-semibold text-indigo-700">
              {{ syllabus.displayName || syllabus.name }}
            </h3>
            <div
              class="mt-2 text-sm grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1"
            >
              <div>
                <span class="text-gray-500">Position:</span>
                <span class="font-medium text-gray-800 ml-1">{{
                  syllabus.position
                }}</span>
              </div>
              <div>
                <span class="text-gray-500">Year:</span>
                <span class="font-medium text-gray-800 ml-1">{{
                  syllabus.year
                }}</span>
              </div>
              <div>
                <span class="text-gray-500">Base Level:</span>
                <span class="font-medium text-gray-800 ml-1">{{
                  syllabus.baseLevel
                }}</span>
              </div>
              <div>
                <span class="text-gray-500">Requirements:</span>
                <span class="font-medium text-gray-800 ml-1">{{
                  syllabus.requirements.length
                }}</span>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              ID:
              <code class="text-xs bg-gray-200 p-1 rounded">{{
                syllabus.id
              }}</code>
            </p>
          </div>
          <div class="flex space-x-2 flex-shrink-0 self-start sm:self-center">
            <button
              @click="handleEditSyllabus(syllabus.id)"
              class="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600"
            >
              Edit / View
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
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700"
      >
        Download Current Syllabi (.js)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { useUiStore } from "@/stores/uiStore";

const router = useRouter();
const syllabiStore = useSyllabiStore();
const uiStore = useUiStore();

const sharpSyllabusFileInput = ref<HTMLInputElement | null>(null);

const handleImportSharpSyllabus = () => {
  sharpSyllabusFileInput.value?.click();
};

const onSharpSyllabusFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    await syllabiStore.importSyllabiFromSharpExport(input.files[0]);
    input.value = "";
  }
};

const handleAddManualSyllabus = () => {
  // This will eventually navigate to a new route for creating a syllabus from scratch
  // For now, it can just show a notification.
  uiStore.addNotification({
    message: "Manual syllabus creation to be implemented.",
    type: "info",
  });
};

const handleEditSyllabus = (syllabusId: string) => {
  // CORRECTED: Use the router to navigate to the new edit page.
  router.push({ name: "SyllabusEdit", params: { id: syllabusId } });
};

const handleDeleteSyllabus = (syllabusId: string) => {
  if (confirm(`Are you sure you want to delete syllabus ID: ${syllabusId}?`)) {
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
