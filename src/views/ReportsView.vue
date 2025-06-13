<!-- src/views/ReportsView.vue -->
<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8">
    <!-- Header and Key Stats -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
      <p class="mt-1 text-sm text-gray-600">
        High-level overview of personnel training status.
      </p>

      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in stats"
          :key="item.name"
          class="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 shadow-sm sm:px-6 sm:pt-6"
        >
          <dt>
            <div class="absolute rounded-md bg-indigo-500 p-3">
              <component
                :is="item.icon"
                class="h-6 w-6 text-white"
                aria-hidden="true"
              />
            </div>
            <p class="ml-16 truncate text-sm font-medium text-gray-500">
              {{ item.name }}
            </p>
          </dt>
          <dd class="ml-16 flex items-baseline">
            <p class="text-2xl font-semibold text-gray-900">{{ item.stat }}</p>
          </dd>
        </div>
      </dl>
    </div>

    <!-- Navigation to Report Types -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900">Available Reports</h2>
      <p class="mt-1 text-sm text-gray-600">
        Select a report type to view more details.
      </p>
      <ul
        role="list"
        class="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <li
          v-for="report in reportLinks"
          :key="report.name"
          class="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow-sm"
        >
          <router-link
            :to="report.href"
            class="flex flex-1 flex-col p-8 hover:bg-gray-50"
          >
            <component
              :is="report.icon"
              class="mx-auto h-12 w-12 text-gray-400"
              aria-hidden="true"
            />
            <h3 class="mt-6 text-sm font-medium text-gray-900">
              {{ report.name }}
            </h3>
            <dl class="mt-1 flex flex-grow flex-col justify-between">
              <dd class="text-sm text-gray-500">{{ report.description }}</dd>
            </dl>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import {
  UsersIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  CalendarDaysIcon,
} from "@heroicons/vue/24/outline";

const personnelStore = usePersonnelStore();

const stats = computed(() => [
  {
    name: "Total Personnel",
    stat: personnelStore.allPersonnel.length,
    icon: UsersIcon,
  },
  {
    name: "Upgraders At Risk",
    stat: personnelStore.allPersonnel.filter(
      (p) => p.pacingAgainstDeadlineDays && p.pacingAgainstDeadlineDays < 0
    ).length,
    icon: ExclamationTriangleIcon,
  },
  {
    name: "Upgraders Blocked",
    stat: personnelStore.allPersonnel.filter(
      (p) => p.readinessAgainstDeadline === "Blocked"
    ).length,
    icon: LockClosedIcon,
  },
]);

const reportLinks = [
  {
    name: "Individual Reports",
    description: "View detailed progress for each student.",
    href: "/reports/individual",
    icon: DocumentChartBarIcon,
  },
  {
    name: "Track Reports",
    description:
      "Compare progress for all students in a specific track and level.",
    href: "/reports/track",
    icon: UserGroupIcon,
  },
  {
    name: "Monthly Report",
    description: "Generate a summary of training activity for a given month.",
    href: "/reports/monthly",
    icon: CalendarDaysIcon,
  },
  {
    name: "LLM Report Generation",
    description: "Use AI to generate narrative performance reports.",
    href: "/reports/llm",
    icon: CpuChipIcon,
  },
];
</script>
