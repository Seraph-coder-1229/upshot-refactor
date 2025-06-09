<template>
  <div class="flow-root">
    <table class="min-w-full divide-y divide-gray-300">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            @click="sortBy('displayName')"
          >
            Display Name
          </th>
          <th
            scope="col"
            class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            @click="sortBy('type')"
          >
            Type
          </th>
          <th
            scope="col"
            class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            @click="sortBy('level')"
          >
            Level
          </th>
          <th
            scope="col"
            class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            @click="sortBy('difficulty')"
          >
            Difficulty.
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr
          v-for="req in sortedRequirements"
          :key="req.id"
          @click="$emit('edit-requirement', req)"
          class="hover:bg-gray-50 cursor-pointer"
        >
          <td
            class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900"
          >
            {{ req.displayName }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {{ req.type }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {{ req.level }}
          </td>
          <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {{ req.difficulty ?? "N/A" }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType, defineProps, defineEmits } from "vue";
import { type Requirement } from "@/types/syllabiTypes";

const props = defineProps({
  requirements: { type: Array as PropType<Requirement[]>, required: true },
});
defineEmits(["edit-requirement"]);

const sortKey = ref<keyof Requirement>("level");
const sortDirection = ref("asc");

const sortedRequirements = computed(() => {
  return [...props.requirements].sort((a, b) => {
    let aValue = a[sortKey.value];
    let bValue = b[sortKey.value];

    // Handle undefined or null values for sorting
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    let comparison = 0;
    if (aValue > bValue) {
      comparison = 1;
    } else if (aValue < bValue) {
      comparison = -1;
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });
});

function sortBy(key: keyof Requirement) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDirection.value = "asc";
  }
}
</script>
