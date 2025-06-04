<template>
  <AppNotifications />
  <template v-if="uiStore.criticalError">
    <CriticalErrorDisplay />
  </template>
  <template v-else>
    <AppLayout>
      
      <div class="container mx-auto p-4 space-y-6">
        <header class="text-center"></header>

        <div v-if="uiStore.isLoading" class="text-center p-4">
          <p class="text-blue-600 font-semibold">Loading...</p>
          
        </div>

        <section
          id="config-management-stubs"
          class="p-4 border rounded-lg shadow bg-gray-50"
        >
          <h2 class="text-lg font-semibold mb-2">
            Config Management (Placeholder)
          </h2>
          <p class="text-sm text-gray-600">
            Config editor and load/save buttons will go here.
          </p>
        </section>

        <section
          id="file-uploads-stubs"
          class="p-4 border rounded-lg shadow bg-gray-50"
        >
          <h2 class="text-lg font-semibold mb-2">File Uploads (Placeholder)</h2>
          <p class="text-sm text-gray-600">
            Personnel & SHARP file uploaders will go here.
          </p>
        </section>

        <section
          id="main-data-display-stubs"
          class="p-4 border rounded-lg shadow bg-gray-50"
        >
          <h2 class="text-lg font-semibold mb-2">
            Main Data Display (Placeholder)
          </h2>
          <p class="text-sm text-gray-600">
            Reports, charts, and upgrader progress will be displayed here.
          </p>
        </section>

        <footer class="app-footer text-center mt-8 py-4 border-t">
          <button
            @click="triggerExportLogs"
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm mr-4"
          >
            Export Debug Logs
          </button>
          <button
            @click="showHelpModal"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Help
          </button>
        </footer>
      </div>
    </AppLayout>
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from "vue";
import AppLayout from "./components/layout/AppLayout.vue";
import AppNotifications from "./components/ui/AppNotifications.vue";
import CriticalErrorDisplay from "./components/ui/CriticalErrorDisplay.vue";
// Import stores
import { useUiStore } from "./stores/uiStore"; //
import { useAppConfigStore } from "./stores/appConfigStore"; //
import { useSyllabiStore } from "./stores/syllabiStore"; //
// Import stubs for components we will build later
// import FileUploadSection from './components/ui/FileInput.vue'; // Assuming FileInput.vue becomes FileUploadSection
// import ConfigEditor from './components/specific/ConfigEditor/ConfigEditor.vue';

const uiStore = useUiStore(); //
const appConfigStore = useAppConfigStore(); //
const syllabiStore = useSyllabiStore(); //

const instance = getCurrentInstance();

const triggerExportLogs = () => {
  if (instance && instance.appContext.config.globalProperties.$exportLogs) {
    (instance.appContext.config.globalProperties.$exportLogs as () => void)();
  } else {
    uiStore.addNotification({
      message: "Log export function not available.",
      type: "error",
    }); //
  }
};

// Placeholder for help modal visibility
const isHelpModalVisible = ref(false);
const showHelpModal = () => {
  // isHelpModalVisible.value = true;
  uiStore.addNotification({
    message: "Help modal/page to be implemented.",
    type: "info",
  }); //
};

// beforeunload handler to check for unsaved changes
const onBeforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (
    appConfigStore.isDirty ||
    syllabiStore.isDirty /* || otherStore.isDirty */
  ) {
    //
    uiStore.addNotification({
      message: "You have unsaved changes. Please download them before leaving.",
      type: "warning",
      duration: 7000,
    }); //
    event.preventDefault();
    // Standard way to trigger browser's own "are you sure?" dialog
    event.returnValue =
      "You have unsaved changes. Are you sure you want to leave?"; // Some browsers show this text
    return event.returnValue; // For older browsers
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnloadHandler);
  // You can add other initialization logic here if needed
  uiStore.addNotification({
    message: "Application loaded. Welcome!",
    type: "success",
    duration: 3000,
  }); //
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnloadHandler);
});

// Placeholder handlers for file uploads - to be fleshed out in later phases
// const handlePersonnelFile = (file: File) => {
//   uiStore.setLoading(true);
//   console.log('Personnel file selected:', file.name);
//   // personnelStore.loadPersonnelFromFile(file).finally(() => uiStore.setLoading(false));
// };

// const handleSharpFile = (file: File) => {
//   uiStore.setLoading(true);
//   console.log('SHARP file selected:', file.name);
//   // const positionKey = prompt("Enter position key for this SHARP file (e.g., EWO, PILOT):");
//   // if (positionKey) {
//   //   progressStore.loadAndProcessSharpFile(positionKey, file).finally(() => uiStore.setLoading(false));
//   // } else {
//   //   uiStore.setLoading(false);
//   // }
// };
</script>

<style>
/* You can add global styles here if not handled by tailwind.css,
   but prefer Tailwind utilities or tailwind.css for base styles. */
body {
  font-family: sans-serif; /* Example base font */
}
</style>
