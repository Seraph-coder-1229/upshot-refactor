<template>
  <div
    class="p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-md"
  >
    <h2 class="text-xl font-semibold text-yellow-800">Confirm Merge</h2>
    <p class="text-yellow-700 mt-2">
      The uploaded file has been processed. We detected the track:
      <strong class="font-bold">{{
        progressStore.detectedTrack || "Unknown"
      }}</strong
      >.
    </p>
    <p class="text-yellow-700 mt-1">
      Would you like to merge this data into the application?
    </p>
    <div class="mt-6 flex space-x-4">
      <button
        @click="progressStore.confirmAndMergeSharpData()"
        class="px-5 py-2 border rounded-md font-semibold text-white bg-green-600 hover:bg-green-700"
      >
        Yes, Confirm Merge
      </button>
      <button
        @click="progressStore.cancelSharpDataMerge()"
        class="px-5 py-2 border rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProgressStore } from "@/stores/progressStore";
const progressStore = useProgressStore();
</script>
