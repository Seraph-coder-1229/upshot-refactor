<template>
  <AppNotifications />
  <template v-if="uiStore.criticalError">
    <CriticalErrorDisplay />
  </template>
  <template v-else>
    <AppLayout> </AppLayout>
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

// Import specific components
import ConfigEditor from "./components/specific/ConfigEditor/ConfigEditor.vue";
import SyllabusList from "./components/specific/SyllabusManager/SyllabusList.vue";

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
