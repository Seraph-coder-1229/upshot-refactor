<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-900 border-b pb-4">Settings</h1>
    <div class="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
      <router-link
        to="/settings/app"
        class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1"
      >
        <div class="flex items-center">
          <Cog6ToothIcon class="h-10 w-10 text-indigo-500" />
          <div class="ml-4">
            <h2 class="text-lg font-semibold text-gray-800">
              App Configuration
            </h2>
            <p class="text-sm text-gray-600">
              Adjust global application settings and deadlines.
            </p>
          </div>
        </div>
      </router-link>

      <router-link
        to="/syllabi"
        class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-transform transform hover:-translate-y-1"
      >
        <div class="flex items-center">
          <DocumentDuplicateIcon class="h-10 w-10 text-teal-500" />
          <div class="ml-4">
            <h2 class="text-lg font-semibold text-gray-800">
              Syllabus Management
            </h2>
            <p class="text-sm text-gray-600">
              Upload, view, and edit training syllabi.
            </p>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Cog6ToothIcon,
  DocumentDuplicateIcon,
} from "@heroicons/vue/24/outline";
</script>
