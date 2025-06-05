<template>
  <div class="p-6 bg-white rounded-lg shadow-md space-y-6 max-w-3xl mx-auto">
    <h1 class="text-3xl font-semibold text-gray-800 border-b pb-3">
      Help & Support
    </h1>

    <section class="pt-4">
      <h2 class="text-xl font-semibold text-gray-700 mb-3">
        Troubleshooting & Debugging
      </h2>
      <p class="text-sm text-gray-600 mb-4">
        If you encounter issues or unexpected behavior with the application, the
        development team may request a debug log to help diagnose the problem.
        This log contains application activity, configuration details
        (anonymized where appropriate for general reports, but potentially more
        detailed for direct-to-dev logs), and system information.
      </p>
      <button
        @click="handleExportLogs"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Download Debug Report
      </button>
      <p class="text-xs text-gray-500 mt-2">
        This will download a
        <code>UPSHOT_Debug_Report_[timestamp].txt</code> file. Please attach
        this file when reporting an issue.
      </p>
    </section>

    <hr class="my-6" />

    <section>
      <h2 class="text-xl font-semibold text-gray-700 mb-3">
        Frequently Asked Questions (FAQ)
      </h2>
      <div class="space-y-2 text-sm">
        <div>
          <h4 class="font-medium text-gray-800">
            Q: How do I make my configuration changes permanent?
          </h4>
          <p class="text-gray-600">
            A: After editing settings in the "Application Settings" page, click
            "Download Current Config." Rename the downloaded file to
            <code>user_config.js</code> and place it in a
            <code>config</code> folder next to your
            <code>index.html</code> file. Then, reload the application.
          </p>
        </div>
        <div>
          <h4 class="font-medium text-gray-800">
            Q: How do I use custom syllabi?
          </h4>
          <p class="text-gray-600">
            A: You can import a SHARP Syllabus Export Excel file from the
            "Syllabus Management" page. To make your current set of syllabi
            (including imported or manually edited ones) persistent, download
            them via "Download Current Syllabi," rename the file to
            <code>user_syllabi.js</code>, and place it in a
            <code>syllabi</code> folder next to your
            <code>index.html</code> file. Reload the application.
          </p>
        </div>
      </div>
    </section>

    <hr class="my-6" />

    <section>
      <h2 class="text-xl font-semibold text-gray-700 mb-3">
        Contact Development Team
      </h2>
      <p class="text-sm text-gray-600">
        For unresolved issues or feedback, please contact:
        <strong>[Your Dev Team Contact Email or Method]</strong>
      </p>
      <p class="text-sm text-gray-600 mt-1">
        When reporting an issue, please include the downloaded Debug Report if
        possible, and steps to reproduce the problem.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from "vue";
import { useUiStore } from "@/stores/uiStore"; // Assuming you use uiStore for notifications

const instance = getCurrentInstance();
const uiStore = useUiStore();

const handleExportLogs = () => {
  const exportLogsFn = instance?.appContext.config.globalProperties
    .$exportLogs as (() => void) | undefined;
  if (exportLogsFn) {
    exportLogsFn(); // This calls loggingService.exportLogs()
    uiStore.addNotification({
      message: "Debug report download initiated.",
      type: "info",
      duration: 4000,
    });
  } else {
    uiStore.addNotification({
      message: "Log export function is not available. This is unexpected.",
      type: "error",
    });
    console.error("$exportLogs global property not found on Vue instance.");
  }
};
</script>

<style scoped>
/* Add any specific styles for the help page if needed */
</style>
