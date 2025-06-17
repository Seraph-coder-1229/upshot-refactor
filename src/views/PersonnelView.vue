<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="Personnel Roster"
      subtitle="A complete list of all personnel currently loaded in the application."
    >
      <template #actions>
        <router-link
          :to="{ name: 'Dashboard' }"
          class="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span><HomeIcon class="ml-0.5 mr-0.5 h-5 w-5" /></span>
        </router-link>
        <button
          @click="handleDownloadData"
          type="button"
          :disabled="!isPersonnelLoaded"
          class="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span>Download Roster</span>
        </button>
        <router-link
          :to="{ name: 'PersonnelUpload' }"
          class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowUpTrayIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span>Upload New Roster</span>
        </router-link>
      </template>
    </ActionHeader>

    <div class="mt-4 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div v-if="!isPersonnelLoaded" class="text-center py-10">
            <p class="text-gray-500">No personnel data has been loaded.</p>
            <router-link
              :to="{ name: 'PersonnelUpload' }"
              class="text-indigo-600 hover:underline"
            >
              Upload a roster to get started.
            </router-link>
          </div>
          <PersonnelTable v-else :personnel="allPersonnel" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useUiStore } from "@/stores/uiStore";
import { downloadPersonnelData } from "@/core/excelProcessorServices/personnelProcessorService";

import ActionHeader from "@/components/ui/ActionHeader.vue";
import PersonnelTable from "@/components/specific/PersonnelManager/PersonnelTable.vue";
import {
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  HomeIcon,
} from "@heroicons/vue/24/outline";

const personnelStore = usePersonnelStore();
const uiStore = useUiStore();

// Use storeToRefs to keep reactivity on store properties
const { allPersonnel, isDataLoaded: isPersonnelLoaded } =
  storeToRefs(personnelStore);

const handleDownloadData = () => {
  if (personnelStore.allPersonnel.length > 0) {
    downloadPersonnelData(personnelStore.allPersonnel);
    uiStore.addNotification({
      message: "Current roster is being downloaded.",
      type: "info",
    });
  } else {
    uiStore.addNotification({
      message: "No personnel data loaded to download.",
      type: "warning",
    });
  }
};
</script>
