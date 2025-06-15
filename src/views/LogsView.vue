<template>
  <div class="flex flex-col h-full bg-gray-100">
    <header class="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Session Logs</h1>
          <p class="mt-1 text-sm text-gray-500">
            A real-time record of application events. Useful for debugging.
          </p>
        </div>
        <button
          @click="handleDownload"
          type="button"
          class="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowDownTrayIcon class="-ml-0.5 h-5 w-5" />
          Download Logs
        </button>
      </div>
    </header>

    <main class="flex-grow overflow-hidden">
      <div
        ref="logContainer"
        class="h-full overflow-y-auto bg-gray-900 p-4 font-mono text-sm"
      >
        <div v-for="(log, index) in logs" :key="index" class="flex items-start">
          <span class="pr-4 text-gray-500">{{
            formatTimestamp(log.timestamp)
          }}</span>
          <span class="pr-2 font-bold" :class="logLevelColor(log.level)"
            >[{{ log.level }}]</span
          >
          <p class="flex-1 whitespace-pre-wrap text-gray-200">
            {{ log.message }}
          </p>
        </div>
        <div v-if="logs.length === 0" class="text-gray-500">
          No log entries for this session yet.
        </div>
      </div>
    </main>

    <BaseModal
      :is-open="isModalOpen"
      title="Log File Downloaded"
      @close="isModalOpen = false"
    >
      <template #body>
        <div class="text-center">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
          >
            <InformationCircleIcon class="h-6 w-6 text-blue-600" />
          </div>
          <div class="mt-3">
            <p class="text-base text-gray-600">
              Your log file
              <code class="text-sm bg-gray-200 p-1 rounded"
                >UPSHOT_Debug_Report_...txt</code
              >
              has been saved to your downloads folder.
            </p>
          </div>
        </div>
        <div class="mt-4 text-left border-t pt-4">
          <h4 class="font-medium text-gray-800">Submission Instructions:</h4>
          <p class="mt-2 text-sm text-gray-600">
            To help us resolve your issue, please attach the downloaded log file
            in an email to our support team or post it in the appropriate
            support channel.
          </p>
          <div class="mt-3 p-2 bg-gray-100 rounded">
            <span class="font-semibold">Email:</span>
            <a
              href="mailto:support@example.com"
              class="text-indigo-600 hover:underline"
            >
              support@example.com</a
            >
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <button
            @click="isModalOpen = false"
            class="px-4 py-2 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            OK
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { loggingService } from "@/utils/loggingService";
import BaseModal from "@/components/ui/BaseModal.vue";
import {
  ArrowDownTrayIcon,
  InformationCircleIcon,
} from "@heroicons/vue/20/solid";

const logs = ref(loggingService.getLogs());
const isModalOpen = ref(false);
const logContainer = ref<HTMLElement | null>(null);
let logUpdateInterval: number;

const handleDownload = () => {
  loggingService.exportLogs();
  isModalOpen.value = true;
};

const formatTimestamp = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString();
};

const logLevelColor = (level: string) => {
  switch (level) {
    case "ERROR":
      return "text-red-400";
    case "WARN":
      return "text-yellow-400";
    case "INFO":
      return "text-blue-400";
    case "DEBUG":
      return "text-green-400";
    default:
      return "text-gray-400";
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

onMounted(() => {
  // Periodically refresh logs from the service in case new ones are added
  logUpdateInterval = window.setInterval(() => {
    logs.value = loggingService.getLogs();
  }, 2000); // Refresh every 2 seconds
  scrollToBottom();
});

onBeforeUnmount(() => {
  clearInterval(logUpdateInterval);
});

// Watch for changes in the logs array to auto-scroll
watch(
  logs,
  () => {
    scrollToBottom();
  },
  { deep: true }
);
</script>
