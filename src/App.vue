<template>
  <AppNotifications />
  <template v-if="uiStore.criticalError">
    <CriticalErrorDisplay />
  </template>
  <template v-else>
    <AppLayout>
      <div class="container mx-auto p-4 space-y-6">
        <section
          id="app-configuration"
          class="p-4 border rounded-lg shadow bg-white"
        >
          <h2 class="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
            Application Settings
          </h2>

          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 class="text-md font-medium text-blue-700 mb-1">
              How to Save Your Configuration Changes:
            </h3>
            <ol
              class="list-decimal list-inside text-sm text-blue-600 space-y-1"
            >
              <li>Make your desired changes below.</li>
              <li>
                Click the "Download Current Config" button. A file (e.g.,
                <code>upshot_config_download_xxxx.js</code>) will be downloaded.
              </li>
              <li>
                To make these settings load automatically next time you open
                UPSHOT:
                <ul class="list-disc list-inside ml-4">
                  <li>
                    Rename the downloaded file to exactly
                    <code>user_config.js</code>.
                  </li>
                  <li>
                    In the same folder where your main
                    <code>index.html</code> for UPSHOT is located, create a new
                    folder named <code>config</code> (if it doesn't already
                    exist).
                  </li>
                  <li>
                    Move your renamed <code>user_config.js</code> file into this
                    <code>config</code> folder.
                  </li>
                </ul>
              </li>
              <li>Reload the UPSHOT application.</li>
            </ol>
            <p
              v-if="appConfigStore.isDirty"
              class="mt-3 text-yellow-700 font-semibold"
            >
              You have unsaved configuration changes. Please download to persist
              them.
            </p>
          </div>

          <div class="flex flex-wrap gap-3 mb-6">
            <button
              @click="handleDownloadConfig"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download Current Config
            </button>
            <button
              @click="handleResetConfig"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reset Config to Defaults
            </button>
          </div>

          <ConfigEditor />
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
import { onMounted, onBeforeUnmount, getCurrentInstance, ref } from "vue";
// Layout and UI Feedback Components
import AppLayout from "./components/layout/AppLayout.vue";
import AppNotifications from "./components/ui/AppNotifications.vue";
import CriticalErrorDisplay from "./components/ui/CriticalErrorDisplay.vue";
// Stores
import { useUiStore } from "./stores/uiStore";
import { useAppConfigStore } from "./stores/appConfigStore"; // Needed for actions & dirty state
import { useSyllabiStore } from "./stores/syllabiStore"; // For beforeunload dirty check

// Import your new ConfigEditor component
import ConfigEditor from "./components/specific/ConfigEditor/ConfigEditor.vue";

const uiStore = useUiStore();
const appConfigStore = useAppConfigStore(); // Use the store
const syllabiStore = useSyllabiStore(); // For beforeunload

const instance = getCurrentInstance();

const triggerExportLogs = () => {
  const exportLogsFn = instance?.appContext.config.globalProperties
    .$exportLogs as (() => void) | undefined;
  if (exportLogsFn) {
    exportLogsFn();
  } else {
    uiStore.addNotification({
      message: "Log export function not available.",
      type: "error",
    });
  }
};

// Placeholder for help modal visibility - to be implemented fully later
const isHelpModalVisible = ref(false);
const showHelpModal = () => {
  // isHelpModalVisible.value = true;
  uiStore.addNotification({
    message: "Help modal/page will be implemented in a later phase.",
    type: "info",
    duration: 3000,
  });
};

const onBeforeUnloadHandler = (event: BeforeUnloadEvent) => {
  // Now check both stores for dirty state
  if (
    appConfigStore.isDirty ||
    syllabiStore.isDirty /* || otherStore.isDirty */
  ) {
    const confirmationMessage =
      "You have unsaved changes. Are you sure you want to leave?";
    // uiStore.addNotification is good, but the browser prompt is the main blocker here
    event.preventDefault();
    event.returnValue = confirmationMessage;
    return confirmationMessage;
  }
};

// --- New handlers for Config Management ---
const handleDownloadConfig = () => {
  appConfigStore.downloadCurrentConfig();
  // Optionally add a success notification
  uiStore.addNotification({
    message:
      "Configuration download initiated. Follow instructions to make it persistent.",
    type: "info",
    duration: 7000,
  });
};

const handleResetConfig = () => {
  if (
    confirm(
      "Are you sure you want to reset all application settings to their defaults? Any unsaved changes will be lost."
    )
  ) {
    appConfigStore.resetToDefaults();
    uiStore.addNotification({
      message:
        "Configuration has been reset to defaults. Download to save these defaults as your new user config.",
      type: "info",
      duration: 7000,
    });
  }
};

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnloadHandler);
  // uiStore.addNotification({ message: 'Application loaded successfully!', type: 'success', duration: 3000 }); // Already exists from previous step
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnloadHandler);
});

// ... any existing FileUploadSection imports and handlers would remain ...
</script>

<style scoped>
/* You can add global styles here if not handled by tailwind.css,
   but prefer Tailwind utilities or tailwind.css for base styles. */
body {
  font-family: sans-serif; /* Example base font */
}
</style>
