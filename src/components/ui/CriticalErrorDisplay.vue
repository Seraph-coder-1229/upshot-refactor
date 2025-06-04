<template>
  <div
    class="fixed inset-0 bg-red-700 text-white flex flex-col items-center justify-center z-[100] p-8"
  >
    <h1 class="text-4xl font-bold mb-4">Application Error</h1>
    <p class="text-xl mb-2">
      A critical error has occurred, and the application cannot continue
      normally.
    </p>
    <p class="mb-6 text-center">
      {{
        uiStore.criticalErrorMessage || "No specific error message provided."
      }}
    </p>
    <button
      @click="exportLogsAndNotify"
      class="bg-white text-red-700 font-bold py-3 px-6 rounded hover:bg-red-100 text-lg"
    >
      Download Debug Report
    </button>
    <p class="mt-4 text-sm">
      Please provide this report to the development team.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "../../stores/uiStore"; //
import { getCurrentInstance } from "vue";

const uiStore = useUiStore(); //
const instance = getCurrentInstance();

const exportLogsAndNotify = () => {
  if (instance && instance.appContext.config.globalProperties.$exportLogs) {
    (instance.appContext.config.globalProperties.$exportLogs as () => void)();
    uiStore.addNotification({
      type: "info",
      message: "Debug report downloaded.",
    }); //
  } else {
    alert(
      "Log export function is not available. Please check the browser console for logs."
    );
  }
};
</script>
