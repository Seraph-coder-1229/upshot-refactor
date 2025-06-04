<template>
  <div class="p-6 bg-white rounded-lg shadow-md space-y-6">
    <h2 class="text-xl font-semibold text-gray-800 border-b pb-2">
      Application Configuration
    </h2>
    <div>
      <span class="text-sm text-gray-500"
        >Config Version: {{ configStore.currentConfig.version }}</span
      >
    </div>

    <div class="space-y-3">
      <h3 class="text-lg font-medium text-gray-700">General</h3>
      <div class="flex items-center space-x-3">
        <input
          id="useRoundedTrainingStartDate"
          type="checkbox"
          :checked="configStore.currentConfig.useRoundedTrainingStartDate"
          @change="
            configStore.updateUseRoundedTrainingStartDate(
              ($event.target as HTMLInputElement).checked
            )
          "
          class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          for="useRoundedTrainingStartDate"
          class="text-sm font-medium text-gray-700"
        >
          Round Training Start Dates to 1st of Month (after 15th -> next month)
        </label>
      </div>
    </div>

    <div class="space-y-3 border-t pt-4">
      <h3 class="text-lg font-medium text-gray-700">
        Training Department Personnel
      </h3>
      <div
        v-for="key in trainingDepartmentKeys"
        :key="key"
        class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4"
      >
        <label
          :for="`dept-${key}`"
          class="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2 capitalize"
        >
          {{ key.replace(/([A-Z])/g, " $1").trim() }}
        </label>
        <div class="mt-1 sm:col-span-2 sm:mt-0">
          <input
            type="text"
            :id="`dept-${key}`"
            :value="configStore.currentConfig.trainingDepartment[key] || ''"
            @input="
              configStore.updateTrainingDepartmentProperty(
                key,
                ($event.target as HTMLInputElement).value || null
              )
            "
            class="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
        </div>
      </div>
    </div>

    <div class="space-y-3 border-t pt-4">
      <h3 class="text-lg font-medium text-gray-700">
        Curve Deadlines (Months)
      </h3>
      <div
        v-for="(levelSettings, positionKey) in configStore.currentConfig
          .curveDeadlines"
        :key="positionKey"
        class="mb-4 p-3 border rounded-md bg-gray-50"
      >
        <h4 class="text-md font-semibold text-gray-600 capitalize">
          {{ positionKey.replace(/_/g, " ") }}
        </h4>
        <div
          v-for="(deadline, level) in levelSettings"
          :key="`${positionKey}-${level}`"
          class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
        >
          <span class="text-sm font-medium text-gray-700"
            >Level {{ level }}:</span
          >
          <div class="sm:col-span-1">
            <label
              :for="`target-${positionKey}-${level}`"
              class="block text-xs font-medium text-gray-500"
              >Target Months</label
            >
            <input
              type="number"
              min="0"
              :id="`target-${positionKey}-${level}`"
              :value="deadline.targetMonths"
              @input="
                configStore.updateCurveDeadlineSetting(
                  positionKey,
                  parseInt(level as string),
                  {
                    targetMonths:
                      parseInt(($event.target as HTMLInputElement).value) || 0,
                  }
                )
              "
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
          <div class="sm:col-span-1">
            <label
              :for="`deadline-${positionKey}-${level}`"
              class="block text-xs font-medium text-gray-500"
              >Deadline Months</label
            >
            <input
              type="number"
              min="0"
              :id="`deadline-${positionKey}-${level}`"
              :value="deadline.deadlineMonths"
              @input="
                configStore.updateCurveDeadlineSetting(
                  positionKey,
                  parseInt(level as string),
                  {
                    deadlineMonths:
                      parseInt(($event.target as HTMLInputElement).value) || 0,
                  }
                )
              "
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="border-t pt-6">
      <p v-if="configStore.isDirty" class="text-yellow-600 font-semibold">
        Configuration has unsaved changes. Download to persist them.
      </p>
      <p v-else class="text-green-600 font-semibold">
        Configuration is up to date with the last saved/loaded version.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppConfigStore } from "../../../stores/appConfigStore";
import { computed } from "vue";
import { type TrainingDepartmentPersonnelSetting } from "../types/appConfigTypes";

const configStore = useAppConfigStore();

// Helper to get keys for iterating over trainingDepartment for cleaner template
const trainingDepartmentKeys = computed(() => {
  return Object.keys(configStore.currentConfig.trainingDepartment) as Array<
    keyof TrainingDepartmentPersonnelSetting
  >;
});

// Add more specific update methods here if needed, or rely on store actions
// For example, if you want to add a new position to curveDeadlines:
// const addNewPositionToDeadlines = (newPositionKey: string) => {
//   if (!configStore.currentConfig.curveDeadlines[newPositionKey]) {
//     // Call an action in the store to add it with default level settings
//     // configStore.addPositionToCurveDeadlines(newPositionKey);
//     // This makes sure isDirty is handled correctly.
//   }
// };
</script>

<style scoped>
/* Add any specific styles for the config editor if Tailwind utilities aren't enough */
</style>
