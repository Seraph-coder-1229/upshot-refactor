<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="header in headers"
            :key="header.key"
            scope="col"
            class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <div
              class="flex items-center gap-x-2 cursor-pointer"
              @click="header.sortable ? sortBy(header.key) : null"
            >
              {{ header.label }}
              <SortableIcon
                v-if="header.sortable"
                :sortKey="header.key"
                :currentSortKey="sortKey"
                :sortDirection="sortDirection"
              />
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-if="sortedRequirements.length === 0">
          <td :colspan="headers.length" class="text-center py-10 text-gray-500">
            No requirements match the current filters.
          </td>
        </tr>
        <tr
          v-for="req in sortedRequirements"
          :key="req.id"
          @click="$emit('edit-requirement', req)"
          class="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        >
          <td
            class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800"
          >
            {{ req.displayName }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ req.type }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ req.level }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ req.difficulty ?? "N/A" }}
          </td>

          <td class="px-6 py-4 text-sm text-gray-500">
            <span
              v-if="req.prerequisites && req.prerequisites.length > 0"
              class="whitespace-normal"
            >
              {{ req.prerequisites.join(", ") }}
            </span>
            <span v-else class="text-gray-400">N/A</span>
          </td>

          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <span
              v-if="req.isDefaultWaived"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
            >
              Waived
            </span>
            <span
              v-else
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              Required
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ req.rawSharpEventSubtype ?? "N/A" }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType, defineProps, defineEmits, h } from "vue";
import { type Requirement } from "@/types/syllabiTypes";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/solid";

// A small functional component to render the correct sort icon
const SortableIcon = (props: {
  sortKey: string;
  currentSortKey: string;
  sortDirection: "asc" | "desc";
}) => {
  const iconClass = "h-4 w-4 text-gray-400";
  if (props.sortKey !== props.currentSortKey) {
    return h(ChevronUpDownIcon, { class: iconClass });
  }
  return props.sortDirection === "asc"
    ? h(ChevronUpIcon, { class: "h-4 w-4 text-gray-600" })
    : h(ChevronDownIcon, { class: "h-4 w-4 text-gray-600" });
};

const props = defineProps({
  requirements: { type: Array as PropType<Requirement[]>, required: true },
});
defineEmits(["edit-requirement"]);

const headers = ref([
  { key: "displayName", label: "Display Name", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "level", label: "Level", sortable: true },
  { key: "difficulty", label: "Difficulty", sortable: true },
  { key: "prerequisites", label: "Prereqs", sortable: false },
  { key: "isDefaultWaived", label: "Waived", sortable: true },
  { key: "rawSharpEventSubtype", label: "SubType", sortable: true },
]);

const sortKey = ref<keyof Requirement>("displayName");
const sortDirection = ref<"asc" | "desc">("asc");

const sortedRequirements = computed(() => {
  if (!props.requirements) return [];
  return [...props.requirements].sort((a, b) => {
    let aValue = a[sortKey.value];
    let bValue = b[sortKey.value];

    if (aValue == null) return 1;
    if (bValue == null) return -1;

    let comparison = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
    } else {
      if (aValue > bValue) comparison = 1;
      else if (aValue < bValue) comparison = -1;
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
