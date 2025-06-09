<template>
  <div v-if="upgrader && syllabus" class="p-4 sm:p-6 lg:p-8">
    <div class="mb-6 border-b pb-4">
      <button
        @click="goBack"
        class="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
      >
        &larr; Back to Previous Page
      </button>
      <h1 class="text-3xl font-bold text-gray-900">
        {{ upgrader.displayName }}
      </h1>
      <p class="text-lg text-gray-600">
        {{ upgrader.rank }} | {{ upgrader.assignedPosition }} ({{
          syllabus.year
        }})
      </p>
    </div>

    <div class="mb-4 flex flex-wrap gap-4 items-center">
      <div class="flex space-x-2" role="group">
        <button @click="filter = 'all'" :class="getFilterClass('all')">
          All
        </button>
        <button
          @click="filter = 'completed'"
          :class="getFilterClass('completed')"
        >
          Completed
        </button>
        <button
          @click="filter = 'remaining'"
          :class="getFilterClass('remaining')"
        >
          Remaining
        </button>
      </div>
      <div class="flex items-center border-l pl-4">
        <input
          id="show-waived"
          type="checkbox"
          v-model="showWaived"
          class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label
          for="show-waived"
          class="ml-2 block text-sm font-medium text-gray-700"
          >Show Waived Items</label
        >
      </div>
    </div>

    <div class="border rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Requirement
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Level
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              Completion Date
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="filteredRequirements.length === 0">
            <td colspan="5" class="text-center py-10 text-gray-500">
              No requirements match the current filter.
            </td>
          </tr>
          <tr
            v-for="item in filteredRequirements"
            :key="item.requirement.id"
            class="hover:bg-gray-50"
          >
            <td
              class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800"
            >
              {{ item.requirement.displayName }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ item.requirement.type }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ item.requirement.level }}
            </td>
            <td
              class="px-4 py-4 whitespace-nowrap text-sm font-semibold"
              :class="item.statusClass"
            >
              {{ item.status }}
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ item.completionDate }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="p-4 text-center text-gray-500">
    Loading Student Details...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineProps } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePersonnelStore } from "@/stores/personnelStore";
import { useSyllabiStore } from "@/stores/syllabiStore";
import {
  isRequirementWaived,
  arePrerequisitesMet,
} from "@/core/syllabusLogicService";
import { formatUtcDateToDisplay } from "@/utils/dateUtils";
import { type Upgrader } from "@/types/personnelTypes";
import { type Syllabus, type Requirement } from "@/types/syllabiTypes";

type RequirementStatus = "Completed" | "Remaining" | "Waived" | "Blocked";

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();
const route = useRoute();
const personnelStore = usePersonnelStore();
const syllabiStore = useSyllabiStore();

const upgrader = ref<Upgrader | null>(null);
const syllabus = ref<Syllabus | null>(null);
const filter = ref<"all" | "completed" | "remaining">("remaining");
const showWaived = ref(false);

const getRequirementStatus = (
  req: Requirement,
  upg: Upgrader
): RequirementStatus => {
  if (isRequirementWaived(req, upg)) return "Waived";
  const isCompleted = upg.rawCompletions.some(
    (c) => c.event.toUpperCase() === req.name.toUpperCase()
  );
  if (isCompleted) return "Completed";
  if (!arePrerequisitesMet(req, upg)) return "Blocked";
  return "Remaining";
};

const allRequirementsWithStatus = computed(() => {
  if (!upgrader.value || !syllabus.value) return [];

  return syllabus.value.requirements
    .map((req) => {
      const status = getRequirementStatus(req, upgrader.value!);
      const completion = upgrader.value!.rawCompletions.find(
        (c) => c.event.toUpperCase() === req.name.toUpperCase()
      );

      const statusClasses: Record<RequirementStatus, string> = {
        Completed: "text-green-600",
        Remaining: "text-blue-600",
        Waived: "text-gray-500",
        Blocked: "text-red-600",
      };

      return {
        requirement: req,
        status: status,
        statusClass: statusClasses[status],
        completionDate: completion
          ? formatUtcDateToDisplay(completion.date)
          : "N/A",
      };
    })
    .sort(
      (a, b) =>
        a.requirement.level - b.requirement.level ||
        (a.requirement.sequence ?? 999) - (b.requirement.sequence ?? 999)
    );
});

const filteredRequirements = computed(() => {
  let items = allRequirementsWithStatus.value;

  if (!showWaived.value) {
    items = items.filter((item) => item.status !== "Waived");
  }

  if (filter.value === "completed") {
    return items.filter((item) => item.status === "Completed");
  }
  if (filter.value === "remaining") {
    return items.filter(
      (item) => item.status === "Remaining" || item.status === "Blocked"
    );
  }

  return items; // 'all' filter
});

const getFilterClass = (filterName: string) => {
  return filter.value === filterName
    ? "px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm"
    : "px-4 py-2 text-sm font-semibold text-gray-700 bg-white border rounded-md hover:bg-gray-50";
};

const goBack = () => router.back();

onMounted(() => {
  const foundUpgrader = personnelStore.getPersonnelById(props.id);
  if (foundUpgrader) {
    upgrader.value = foundUpgrader;
    syllabus.value =
      syllabiStore.findSyllabus(
        foundUpgrader.assignedPosition,
        foundUpgrader.assignedSyllabusYear
      ) || null;
  }
});
</script>
