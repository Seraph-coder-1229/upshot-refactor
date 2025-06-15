<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900">LLM Report Generation</h1>
        <p class="mt-2 text-sm text-gray-700">
          Use AI to generate narrative summaries for each track.
        </p>
      </div>
    </div>

    <div class="mt-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <div
          v-if="!apiKey"
          class="p-4 bg-yellow-50 border-l-4 border-yellow-400"
        >
          <p class="text-sm text-yellow-700">
            No Gemini API key found. Reports must be generated manually.
            <router-link
              to="/settings/app"
              class="font-medium underline hover:text-yellow-800"
              >Add API Key in Settings</router-link
            >
            to enable automatic report generation.
          </p>
        </div>

        <div class="mt-4 flex items-center gap-4">
          <button
            @click="handleGenerate"
            :disabled="isLoading"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <svg
              v-if="isLoading"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ buttonText }}
          </button>
          <p v-if="isLoading" class="text-sm text-gray-600">
            {{ loadingStatus }}
          </p>
        </div>

        <div v-if="error" class="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
          <h3 class="text-sm font-medium text-red-800">
            Error Generating Report
          </h3>
          <p class="mt-2 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>

      <div v-if="Object.keys(prompts).length > 0" class="mt-8">
        <div v-if="!apiKey && !showFinalReport" class="space-y-6">
          <div
            v-for="(prompt, trackName) in prompts"
            :key="trackName"
            class="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 class="text-lg font-semibold text-gray-800">
              {{ trackName }} Report Prompt
            </h3>
            <textarea readonly :value="prompt"></textarea>
            <button
              @click="copyToClipboard(prompt)"
              class="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Copy Prompt
            </button>
            <div class="mt-4">
              <label
                :for="`response-${trackName}`"
                class="block text-sm font-medium text-gray-700"
                >Paste AI Response for {{ trackName }}</label
              >
              <textarea
                v-model="manualResponses[trackName]"
                :id="`response-${trackName}`"
                rows="8"
                class="w-full mt-1 p-2 border rounded shadow-sm"
              ></textarea>
            </div>
          </div>
          <button
            @click="processManualResponses"
            class="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
          >
            Process Pasted Responses
          </button>
        </div>

        <div v-if="showFinalReport" class="space-y-6">
          <div
            v-for="(report, trackName) in finalReports"
            :key="trackName"
            class="bg-white p-6 rounded-lg shadow-sm prose max-w-none"
          >
            <h2 class="!text-2xl !font-bold !text-indigo-700">
              {{ trackName }} :: AI-Generated Narrative Report
            </h2>
            <div v-html="formatReport(report)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { useUiStore } from "@/stores/uiStore";
import * as reportGenerator from "@/core/reportGeneratorService";
import * as anonymizer from "@/utils/anonymizer";
import { callGeminiApi } from "@/core/geminiService";
import { marked } from "marked";

const appConfigStore = useAppConfigStore();
const uiStore = useUiStore();

const isLoading = ref(false);
const loadingStatus = ref("");
const error = ref("");
const prompts = ref<{ [key: string]: string }>({});
const manualResponses = ref<{ [key: string]: string }>({});
const finalReports = ref<{ [key: string]: string }>({});
const keyMap = ref<Map<string, string>>(new Map());
const showFinalReport = ref(false);

const apiKey = computed(() => appConfigStore.config.geminiApiKey);
const buttonText = computed(() => {
  if (isLoading.value) return "Generating...";
  return apiKey.value
    ? "Generate Full Report"
    : "Generate Prompts for Manual Entry";
});

const handleGenerate = async () => {
  isLoading.value = true;
  error.value = "";
  showFinalReport.value = false;
  prompts.value = {};
  finalReports.value = {};

  try {
    loadingStatus.value = "Preparing and anonymizing data...";
    const { reportData, keyMap: newKeyMap } =
      await reportGenerator.generateLLMReportData();
    keyMap.value = newKeyMap;

    loadingStatus.value = "Generating prompts...";
    const generatedPrompts =
      reportGenerator.generateLlmPromptsFromData(reportData);
    prompts.value = generatedPrompts;

    if (apiKey.value) {
      // Pathway 1: Automatic API call
      const trackNames = Object.keys(generatedPrompts);
      for (let i = 0; i < trackNames.length; i++) {
        const trackName = trackNames[i];
        loadingStatus.value = `Calling AI for ${trackName} report (${i + 1}/${
          trackNames.length
        })...`;
        const responseText = await callGeminiApi(
          generatedPrompts[trackName],
          apiKey.value
        );
        finalReports.value[trackName] = anonymizer.deAnonymizeText(
          responseText,
          keyMap.value
        );
      }
      showFinalReport.value = true;
    }
    // For Pathway 2, we just stop here and let the user copy prompts
  } catch (e: any) {
    error.value = e.message || "An unknown error occurred.";
    uiStore.addNotification({ type: "error", message: error.value });
  } finally {
    isLoading.value = false;
    loadingStatus.value = "";
  }
};

const processManualResponses = () => {
  finalReports.value = {};
  for (const trackName in manualResponses.value) {
    const rawResponse = manualResponses.value[trackName];
    if (rawResponse) {
      finalReports.value[trackName] = anonymizer.deAnonymizeText(
        rawResponse,
        keyMap.value
      );
    }
  }
  showFinalReport.value = true;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  uiStore.addNotification({
    type: "success",
    message: "Prompt copied to clipboard!",
  });
};

const formatReport = (reportText: string) => {
  // Use the 'marked' library to convert Markdown from the AI into HTML
  return marked(reportText);
};
</script>
