<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <ActionHeader
      title="Syllabus Management"
      subtitle="View, edit, or upload new syllabus definitions."
    >
      <template #actions>
        <router-link
          :to="{ name: 'SyllabusUpload' }"
          class="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowUpTrayIcon class="-ml-0.5 mr-1.5 h-5 w-5" />
          <span>Upload New Syllabus</span>
        </router-link>
      </template>
    </ActionHeader>

    <SyllabusList />
  </div>
</template>

<script setup lang="ts">
import ActionHeader from "@/components/ui/ActionHeader.vue";
import SyllabusList from "@/components/specific/SyllabusManager/SyllabusList.vue";
import { ArrowUpTrayIcon } from "@heroicons/vue/24/outline";
</script>
