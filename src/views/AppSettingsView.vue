<!-- eslint-disable vue/valid-v-model -->
<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="sm:flex sm:items-center sm:justify-between">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-bold text-primary">Application Settings</h1>
        <p class="mt-2 text-sm text-secondary">
          Manage global settings, department info, API keys, and track
          deadlines.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          @click="saveChanges"
          type="button"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-action/90 focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 sm:w-auto"
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
          <h2 class="text-base font-semibold leading-7 text-secondary">
            General
          </h2>
          <p class="mt-1 text-sm leading-6 text-secondary/80">
            High-level application settings.
          </p>
        </div>
        <div class="md:col-span-2 space-y-6">
          <div>
            <label
              for="primary-user"
              class="block text-sm font-medium text-secondary"
              >Training Officer</label
            >
            <input
              type="text"
              v-model="editableConfig.trainingDepartment.departmentHead"
              id="primary-user"
              class="mt-1 block w-full max-w-xs shadow-sm sm:text-sm border-secondary/30 rounded-md px-3 py-1.5"
            />
          </div>
          <fieldset>
            <div class="relative flex items-start">
              <div class="flex h-6 items-center">
                <input
                  id="round-dates"
                  type="checkbox"
                  v-model="editableConfig.useRoundedTrainingStartDate"
                  class="h-4 w-4 rounded border-secondary/30 text-primary focus:ring-primary"
                />
              </div>
              <div class="ml-3 text-sm leading-6">
                <label for="round-dates" class="font-medium text-secondary"
                  >Use Rounded Training Start Dates</label
                >
                <p class="text-secondary/80">
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
          <h2 class="text-base font-semibold leading-7 text-secondary">
            Track Deadlines
          </h2>
          <p class="mt-1 text-sm leading-6 text-secondary/80">
            Define target and deadline months for each qualification level by
            position.
          </p>
        </div>
        <div class="md:col-span-2 space-y-8">
          <div
            v-for="(
              positionSetting, positionKey
            ) in editableConfig.positionSettings"
            :key="positionKey"
            class="space-y-4"
          >
            <h3 class="font-medium text-secondary uppercase">
              {{ positionKey }}
            </h3>
            <div class="space-y-4 pl-4 border-l-2 border-secondary/20">
              <div
                v-for="(deadline, level) in positionSetting.deadlines"
                :key="level"
                class="grid grid-cols-1 sm:grid-cols-3 items-center gap-4"
              >
                <label
                  class="text-sm font-medium text-secondary/90"
                  :for="`target-${positionKey}-${level}`"
                  >Level {{ level }}</label
                >
                <div class="sm:col-span-1">
                  <label
                    :for="`target-${positionKey}-${level}`"
                    class="block text-xs font-medium text-secondary/70"
                    >Target Months</label
                  >
                  <input
                    type="number"
                    min="0"
                    :id="`target-${positionKey}-${level}`"
                    :value="deadline.targetMonths"
                    @input="
                      appConfigStore.updateCurveDeadlineSetting(
                        positionKey as string,
                        parseInt(level),
                        {
                          targetMonths: parseInt(
                            ($event.target as HTMLInputElement).value
                          ),
                        }
                      )
                    "
                    class="mt-1 block w-full rounded-md border-secondary/30 shadow-sm sm:text-sm px-3 py-1.5"
                  />
                </div>
                <div class="sm:col-span-1">
                  <label
                    :for="`deadline-${positionKey}-${level}`"
                    class="block text-xs font-medium text-secondary/70"
                    >Deadline Months</label
                  >
                  <input
                    type="number"
                    min="0"
                    :id="`deadline-${positionKey}-${level}`"
                    :value="deadline.deadlineMonths"
                    @input="
                      appConfigStore.updateCurveDeadlineSetting(
                        positionKey as string,
                        parseInt(level),
                        {
                          deadlineMonths: parseInt(
                            ($event.target as HTMLInputElement).value
                          ),
                        }
                      )
                    "
                    class="mt-1 block w-full rounded-md border-secondary/30 shadow-sm sm:text-sm px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 bg-white p-6 rounded-lg shadow-sm"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-secondary">
            Color Scheme
          </h2>
          <p class="mt-1 text-sm leading-6 text-secondary/80">
            Select the base colors for the application theme. Hover and text
            colors will be generated automatically.
          </p>
        </div>
        <div class="grid grid-cols-1 gap-6 md:col-span-2 sm:grid-cols-2">
          <div
            v-for="key in (['primary', 'secondary', 'accent'] as const)"
            :key="key"
            class="flex flex-col"
          >
            <label
              :for="key"
              class="block text-sm font-medium capitalize text-secondary"
              >{{ key }}</label
            >
            <div class="mt-1 flex items-center gap-x-3">
              <input
                type="color"
                :id="key"
                :value="editableConfig.colorScheme[key].DEFAULT"
                @input="
                  updateThemeColor(
                    key,
                    ($event.target as HTMLInputElement).value
                  )
                "
                class="h-10 w-20 rounded-md border-secondary/30 cursor-pointer"
              />
              <span
                class="px-3 py-1.5 rounded-md text-sm"
                :style="{
                  backgroundColor: editableConfig.colorScheme[key].DEFAULT,
                  color: editableConfig.colorScheme[key].foreground,
                }"
                >Aa</span
              >
            </div>
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3 bg-white p-6 rounded-lg shadow-sm"
      >
        <div>
          <h2 class="text-base font-semibold leading-7 text-secondary">
            Department & API
          </h2>
          <p class="mt-1 text-sm leading-6 text-secondary/80">
            Info for report headers and AI integration.
          </p>
        </div>
        <div class="md:col-span-2 space-y-8">
          <div>
            <h3 class="font-medium text-secondary">Training Department Info</h3>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 mt-2">
              <div
                v-for="key in Object.keys(editableConfig.trainingDepartment)"
                :key="key"
                class="sm:col-span-3"
              >
                <label
                  :for="key"
                  class="block text-sm font-medium capitalize text-secondary"
                  >{{ key.replace(/([A-Z])/g, " $1").trim() }}</label
                >
                <input
                  type="text"
                  :id="key"
                  v-model="editableConfig.trainingDepartment[key] as string"
                  class="mt-1 block w-full rounded-md border-secondary/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-1.5"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-medium text-secondary">API Keys</h3>
            <div class="mt-2">
              <label
                for="gemini-api-key"
                class="block text-sm font-medium text-secondary"
                >Gemini API Key</label
              >
              <input
                type="password"
                v-model="editableConfig.geminiApiKey"
                id="gemini-api-key"
                class="mt-1 block w-full rounded-md border-secondary/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-1.5"
                placeholder="Enter your Gemini API key"
              />
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
// The existing fileHandlerService import can be removed if not used elsewhere in this component
// import { fileHandlerService } from "@/core/fileHandlerService";
import type { AppConfig, ColorThemeValue } from "@/types/appConfigTypes";
import { defaultConfig } from "@/config/appConfigDefaults";
import { deepClone } from "@/utils/dataUtils";
// Import the new color utilities
import {
  calculateHoverColor,
  calculateForegroundColor,
} from "@/utils/colorUtils";

const appConfigStore = useAppConfigStore();
const uiStore = useUiStore();
const editableConfig = ref<AppConfig | null>(null);

/**
 * ADD THIS FUNCTION:
 * Updates a theme color object based on a new base color.
 */
function updateThemeColor(
  key: "primary" | "secondary" | "accent",
  newColor: string
) {
  if (editableConfig.value) {
    const colorTheme = editableConfig.value.colorScheme[key] as ColorThemeValue;
    colorTheme.DEFAULT = newColor;
    colorTheme.hover = calculateHoverColor(newColor);
    colorTheme.foreground = calculateForegroundColor(newColor);
  }
}

// onMounted and saveChanges from the junior dev's code are mostly fine.
// We just need to make sure the saveChanges function calls updateConfig, which it does.
onMounted(() => {
  // This logic is complex; let's keep it as is, it correctly creates a deep clone.
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
