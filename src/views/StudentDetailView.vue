<!-- src/views/StudentDetailView.vue -->
<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div v-if="upgrader">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ upgrader.displayName }}
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            {{ upgrader.rank }} | {{ upgrader.assignedPosition }} | Start Date:
            {{ new Date(upgrader.startDate).toLocaleDateString() }}
          </p>
        </div>
        <button
          @click="$router.back()"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          &larr; Back to Reports
        </button>
      </div>

      <!-- The IndividualReport component will render the detailed charts and lists -->
      <div class="mt-6">
        <IndividualReport :upgrader-id="id" />
      </div>
    </div>
    <div v-else class="text-center py-12">
      <h2 class="text-xl font-semibold text-gray-700">Upgrader Not Found</h2>
      <p class="mt-2 text-gray-500">
        Could not find a student with the ID: {{ id }}
      </p>
      <div class="mt-6">
        <router-link
          to="/reports/individual"
          class="text-indigo-600 hover:text-indigo-500 font-semibold"
        >
          &larr; Return to Individual Reports List
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import IndividualReport from "@/components/specific/reports/IndividualReport.vue";
import { useRouter } from "vue-router";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const personnelStore = usePersonnelStore();
const router = useRouter();

// Find the upgrader in the store based on the ID from the URL
const upgrader = computed(() => personnelStore.getPersonnelById(props.id));
console.log("Upgrader:", upgrader.value);
</script>
