<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-gray-900">Personnel Manager</h1>
        <p class="mt-2 text-sm text-gray-700">
          Load and view all personnel records from an Excel file.
        </p>
      </div>
    </div>
    <div class="mt-6">
      <PersonnelFileUpload />
      <PersonnelTable />
    </div>
  </div>
</template>

<script setup lang="ts">
import PersonnelFileUpload from "./PersonnelFileUpload.vue";
import PersonnelTable from "./PersonnelTable.vue";
</script>
