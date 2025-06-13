<!-- src/views/PersonnelUploadView.vue -->
<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold">Personnel Data Uploader</h1>

    <!-- File Upload Section -->
    <div
      v-if="!stagedPersonnel.length"
      class="mt-4 p-6 border-2 border-dashed rounded-lg"
    >
      <div class="text-center">
        <UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          Upload Personnel File
        </h3>
        <p class="mt-1 text-sm text-gray-600">
          Attach the approved personnel Excel file.
        </p>
        <div class="mt-6">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            class="sr-only"
            accept=".xlsx, .xls"
          />
          <button
            @click="fileInput?.click()"
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Select File
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Section -->
    <div v-else class="mt-6">
      <h2 class="text-lg font-medium">Confirm Personnel Roster</h2>
      <p class="text-sm text-gray-600">
        The following {{ stagedPersonnel.length }} personnel were found in the
        file. Please confirm this is correct.
      </p>

      <div class="mt-4 max-h-96 overflow-y-auto border rounded-lg">
        <PersonnelTable :personnel="stagedPersonnel" />
      </div>

      <div class="mt-6 flex justify-end space-x-4">
        <button
          @click="handleDeny"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <XCircleIcon class="h-5 w-5 mr-2 text-red-500" />
          Deny & Upload New File
        </button>
        <button
          @click="handleAccept"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <CheckCircleIcon class="h-5 w-5 mr-2" />
          Accept Roster
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { usePersonnelStore } from "@/stores/personnelStore";
import PersonnelTable from "@/components/specific/PersonnelManager/PersonnelTable.vue";
import {
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";
import { processPersonnelFile } from "@/core/excelProcessorServices/personnelProcessorService";
import { useUiStore } from "@/stores/uiStore";
import { type Upgrader } from "@/types/personnelTypes";

const router = useRouter();
const personnelStore = usePersonnelStore();
const uiStore = useUiStore();
const fileInput = ref<HTMLInputElement | null>(null);

// Staged data is now correctly typed as an array of Upgrader objects.
const stagedPersonnel = ref<Upgrader[]>([]);

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  const file = target.files[0];
  uiStore.setGlobalLoading(true);
  try {
    const personnelList: Upgrader[] = await processPersonnelFile(file);
    if (personnelList.length > 0) {
      stagedPersonnel.value = personnelList;
      uiStore.addNotification({
        message: `Found ${personnelList.length} personnel. Please confirm.`,
        type: "info",
      });
    } else {
      uiStore.addNotification({
        message: "No personnel found in the file.",
        type: "warning",
      });
    }
  } catch (error) {
    console.error(error);
    uiStore.addNotification({
      message: "Failed to process the personnel file.",
      type: "error",
    });
  } finally {
    uiStore.setGlobalLoading(false);
  }
};

const handleAccept = () => {
  personnelStore.setPersonnel(stagedPersonnel.value);
  uiStore.addNotification({
    message: "Personnel roster accepted.",
    type: "success",
  });
  router.push("/");
};

const handleDeny = () => {
  stagedPersonnel.value = [];
  if (fileInput.value) fileInput.value.value = "";
  uiStore.addNotification({
    message: "Roster denied. Please upload a new file.",
    type: "info",
  });
};
</script>
