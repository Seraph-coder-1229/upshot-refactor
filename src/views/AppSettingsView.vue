<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-gray-900">Application Settings</h1>
        <p class="mt-2 text-sm text-gray-700">
          Manage global settings, department info, API keys, and track
          deadlines.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          @click="saveChanges"
          type="button"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          Save and Download
        </button>
      </div>
    </div>

    <div v-if="editableConfig" class="mt-8 space-y-10">
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 bg-white p-6 rounded-lg shadow-sm"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            General
          </h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            High-level application settings.
          </p>
        </div>
        <div class="md:col-span-2 space-y-6">
          <div>
            <label
              for="primary-user"
              class="block text-sm font-medium text-gray-700"
              >Training Officer</label
            >
            <input
              type="text"
              v-model="editableConfig.trainingDepartment.departmentHead"
              id="primary-user"
              class="mt-1 block w-full max-w-xs shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-1.5"
            />
          </div>
          <fieldset>
            <div class="relative flex items-start">
              <div class="flex h-6 items-center">
                <input
                  id="round-dates"
                  type="checkbox"
                  v-model="editableConfig.useRoundedTrainingStartDate"
                  class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
              </div>
              <div class="ml-3 text-sm leading-6">
                <label for="round-dates" class="font-medium text-gray-900"
                  >Use Rounded Training Start Dates</label
                >
                <p class="text-gray-500">
                  If checked, start dates after the 15th will round to the 1st
                  of the next month.
                </p>
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 bg-white p-6 rounded-lg shadow-sm"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            Department & API
          </h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            Info for report headers and AI integration.
          </p>
        </div>
        <div class="md:col-span-2 space-y-8">
          <div>
            <h3 class="font-medium text-gray-800">Training Department Info</h3>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 mt-2">
              <div
                v-for="key in Object.keys(editableConfig.trainingDepartment)"
                :key="key"
                class="sm:col-span-3"
              >
                <label
                  :for="key"
                  class="block text-sm font-medium capitalize text-gray-700"
                  >{{ key.replace(/([A-Z])/g, " $1").trim() }}</label
                >
                <input
                  type="text"
                  :id="key"
                  v-model="editableConfig.trainingDepartment[key]"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-medium text-gray-800">API Keys</h3>
            <div class="mt-2">
              <label
                for="gemini-api-key"
                class="block text-sm font-medium text-gray-700"
                >Gemini API Key</label
              >
              <input
                type="password"
                v-model="editableConfig.geminiApiKey"
                id="gemini-api-key"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                placeholder="Enter your Gemini API key"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 bg-white p-6 rounded-lg shadow-sm"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-gray-900">
            Position & Deadline Settings
          </h2>
          <p class="mt-1 text-sm leading-6 text-gray-600">
            Define target and deadline months for each qualification level
            within a position.
          </p>
        </div>
        <div class="md:col-span-2 space-y-6">
          <div
            v-for="(
              positionSetting, positionKey
            ) in editableConfig.positionSettings"
            :key="positionKey"
            class="p-4 border rounded-lg"
          >
            <h3 class="text-lg font-medium text-indigo-600">
              {{ positionKey }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4">
              <div
                v-for="(deadline, level) in positionSetting.deadlines"
                :key="level"
                class="border-t pt-4"
              >
                <h4 class="text-sm font-medium text-gray-800">
                  Level {{ level }}
                </h4>
                <div class="mt-2">
                  <label
                    :for="`${positionKey}-${level}-target`"
                    class="block text-xs font-medium text-gray-500"
                    >Target Months</label
                  >
                  <input
                    type="number"
                    :id="`${positionKey}-${level}-target`"
                    v-model.number="deadline.targetMonths"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                  />
                </div>
                <div class="mt-2">
                  <label
                    :for="`${positionKey}-${level}-deadline`"
                    class="block text-xs font-medium text-gray-500"
                    >Deadline Months</label
                  >
                  <input
                    type="number"
                    :id="`${positionKey}-${level}-deadline`"
                    v-model.number="deadline.deadlineMonths"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center mt-8">
      <p>Loading configuration...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAppConfigStore } from "@/stores/appConfigStore";
import { useUiStore } from "@/stores/uiStore";
import { fileHandlerService } from "@/core/fileHandlerService";
import type { AppConfig } from "@/types/appConfigTypes";
import { defaultConfig } from "@/config/appConfigDefaults";
import { deepClone } from "@/utils/dataUtils";

const appConfigStore = useAppConfigStore();
const uiStore = useUiStore();

const editableConfig = ref<AppConfig | null>(null);

onMounted(() => {
  const configCopy = deepClone(appConfigStore.config) as AppConfig;

  for (const key in defaultConfig) {
    if (configCopy[key] === undefined) {
      configCopy[key] = defaultConfig[key];
    }
  }
  if (!configCopy.trainingDepartment) {
    configCopy.trainingDepartment = deepClone(defaultConfig.trainingDepartment);
  }

  editableConfig.value = configCopy;
});

const saveChanges = () => {
  if (editableConfig.value) {
    appConfigStore.updateConfig(editableConfig.value);
    appConfigStore.downloadCurrentConfig();
    uiStore.addNotification({
      message: "Configuration saved and downloaded as 'user_app_config.js'.",
      type: "success",
    });
  }
};
</script>
