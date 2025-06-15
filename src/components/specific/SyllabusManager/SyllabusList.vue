<template>
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900">
        Loaded Syllabi
      </h3>
      <div v-if="syllabiStore.allSyllabi.length > 0" class="mt-4">
        <ul role="list" class="divide-y divide-gray-200">
          <li
            v-for="syllabus in syllabiStore.allSyllabi"
            :key="syllabus.id"
            class="flex items-center justify-between py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-indigo-600 truncate">
                {{ syllabus.displayName }}
              </p>
              <p class="text-sm text-gray-500">
                {{ syllabus.position }} - {{ syllabus.year }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 space-x-2">
              <router-link
                :to="{ name: 'SyllabusEdit', params: { id: syllabus.id } }"
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </router-link>
              <button
                @click="handleDelete(syllabus.id)"
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </div>
      <div v-else class="text-center py-6">
        <p class="text-gray-500">No syllabi have been loaded.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSyllabiStore } from "@/stores/syllabiStore";

const syllabiStore = useSyllabiStore();

const handleDelete = (id: string) => {
  // FIX: Ensure syllabus exists before attempting deletion
  if (
    confirm(
      "Are you sure you want to delete this syllabus? This cannot be undone."
    )
  ) {
    const syllabusExists = syllabiStore.allSyllabi.some((s) => s.id === id);
    if (syllabusExists) {
      syllabiStore.removeSyllabus(id);
    } else {
      console.warn(
        `Attempted to delete a syllabus that does not exist with id: ${id}`
      );
    }
  }
};
</script>
