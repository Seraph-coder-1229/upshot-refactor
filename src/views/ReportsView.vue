<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
      <p class="mt-2 text-sm text-gray-600">
        High-level overview of personnel training status and readiness.
      </p>
    </div>

    <div class="mt-8">
      <h2 class="text-lg font-medium text-gray-900 sr-only">At a Glance</h2>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in stats"
          :key="item.name"
          class="bg-white p-5 rounded-xl shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow"
        >
          <div class="flex-shrink-0 p-3 rounded-full" :class="item.bgColor">
            <component
              :is="item.icon"
              class="h-6 w-6"
              :class="item.iconColor"
              aria-hidden="true"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 truncate">
              {{ item.name }}
            </p>
            <p class="mt-1 text-3xl font-semibold text-gray-900">
              {{ item.stat }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-8">
        <div
          class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="p-5">
            <h2 class="text-xl font-semibold text-gray-900">Watch List</h2>
            <p class="mt-1 text-sm text-gray-500">
              Upgraders who are at risk, behind, or blocked, sorted by urgency.
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Pacing
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="watchList.length === 0">
                  <td
                    colspan="3"
                    class="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    All personnel are on track. Great job!
                  </td>
                </tr>
                <tr
                  v-for="person in watchList"
                  :key="person.id"
                  class="hover:bg-gray-50"
                >
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {{ person.displayName }}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                    :class="getPacingClass(person.pacingAgainstDeadlineDays)"
                  >
                    {{ getPacingText(person.pacingAgainstDeadlineDays) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="
                        readinessStatusColor(person.readinessAgainstDeadline)
                      "
                    >
                      {{ person.readinessAgainstDeadline }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1 space-y-8">
        <div
          class="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 class="text-xl font-semibold text-gray-900">
            Squadron Readiness
          </h2>
          <div class="mt-4 h-80 flex items-center justify-center">
            <ReadinessDonutChart
              v-if="isPersonnelLoaded"
              :chartData="readinessDataForChart"
            />
            <p v-else class="text-sm text-gray-500">
              Load personnel data to view chart.
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-gray-900 px-1">
            Available Reports
          </h2>
          <router-link
            v-for="report in reportLinks"
            :key="report.name"
            :to="report.href"
            class="block p-4 bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0 p-3 rounded-lg" :class="report.color">
                <component :is="report.icon" class="h-6 w-6 text-white" />
              </div>
              <div class="ml-4">
                <h3 class="text-base font-semibold text-gray-900">
                  {{ report.name }}
                </h3>
                <p class="text-sm text-gray-500">{{ report.description }}</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { ReadinessStatus } from "@/types/personnelTypes";
import {
  UsersIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  CalendarDaysIcon,
} from "@heroicons/vue/24/outline";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "vue-chartjs";

ChartJS.register(ArcElement, Tooltip, Legend);

const ReadinessDonutChart = {
  name: "ReadinessDonutChart",
  components: { Doughnut },
  props: { chartData: { type: Object, required: true } },
  setup(props) {
    const data = computed(() => ({
      labels: props.chartData.labels,
      datasets: [
        {
          backgroundColor: props.chartData.backgroundColors,
          data: props.chartData.data,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    }));
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
    };
    return () => h(Doughnut, { data: data.value, options: chartOptions });
  },
};

const personnelStore = usePersonnelStore();
const isPersonnelLoaded = computed(() => personnelStore.isDataLoaded);

const stats = computed(() => [
  {
    name: "Total Personnel",
    stat: personnelStore.allPersonnel.length,
    icon: UsersIcon,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    name: "At Risk or Behind",
    stat: personnelStore.allPersonnel.filter((p) =>
      [ReadinessStatus.AtRisk, ReadinessStatus.BehindSchedule].includes(
        p.readinessAgainstDeadline
      )
    ).length,
    icon: ExclamationTriangleIcon,
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    name: "Blocked",
    stat: personnelStore.allPersonnel.filter(
      (p) => p.readinessAgainstDeadline === ReadinessStatus.Blocked
    ).length,
    icon: LockClosedIcon,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
  },
]);

const readinessDataForChart = computed(() => {
  const orderedStatuses = [
    ReadinessStatus.OnTrack,
    ReadinessStatus.AtRisk,
    ReadinessStatus.BehindSchedule,
    ReadinessStatus.Blocked,
    ReadinessStatus.ReadyForNextLevel,
    ReadinessStatus.Unknown,
  ];
  const colorMap: { [key in ReadinessStatus]: string } = {
    [ReadinessStatus.OnTrack]: "#10B981",
    [ReadinessStatus.AtRisk]: "#F59E0B",
    [ReadinessStatus.BehindSchedule]: "#EF4444",
    [ReadinessStatus.Blocked]: "#6B7280",
    [ReadinessStatus.ReadyForNextLevel]: "#3B82F6",
    [ReadinessStatus.Unknown]: "#A78BFA",
  };
  const counts = new Map<ReadinessStatus, number>();
  orderedStatuses.forEach((status) => counts.set(status, 0));
  personnelStore.allPersonnel.forEach((p) => {
    const status = p.readinessAgainstDeadline || ReadinessStatus.Unknown;
    if (counts.has(status)) {
      counts.set(status, counts.get(status)! + 1);
    }
  });
  const labels: string[] = [];
  const data: number[] = [];
  const backgroundColors: string[] = [];
  orderedStatuses.forEach((status) => {
    if ((counts.get(status) || 0) > 0) {
      // Only show statuses with data
      labels.push(status);
      data.push(counts.get(status) || 0);
      backgroundColors.push(colorMap[status]);
    }
  });
  return { labels, data, backgroundColors };
});

const watchList = computed(() => {
  return personnelStore.allPersonnel
    .filter(
      (p) =>
        p.readinessAgainstDeadline &&
        [
          ReadinessStatus.AtRisk,
          ReadinessStatus.BehindSchedule,
          ReadinessStatus.Blocked,
        ].includes(p.readinessAgainstDeadline)
    )
    .sort(
      (a, b) =>
        (a.pacingAgainstDeadlineDays ?? 0) - (b.pacingAgainstDeadlineDays ?? 0)
    )
    .slice(0, 5);
});

const getPacingText = (pacing?: number) => {
  if (pacing === undefined || pacing === null) return "N/A";
  if (pacing >= 0) return `${pacing}d Ahead`;
  return `${Math.abs(pacing)}d Behind`;
};

const getPacingClass = (pacing?: number) => {
  if (pacing === undefined || pacing === null) return "text-gray-500";
  return pacing < 0 ? "text-red-600" : "text-green-600";
};

const readinessStatusColor = (status?: ReadinessStatus) => {
  const classes = {
    [ReadinessStatus.OnTrack]: "bg-green-100 text-green-800",
    [ReadinessStatus.ReadyForNextLevel]: "bg-blue-100 text-blue-800",
    [ReadinessStatus.AtRisk]: "bg-yellow-100 text-yellow-800",
    [ReadinessStatus.BehindSchedule]: "bg-red-100 text-red-800",
    [ReadinessStatus.Blocked]: "bg-gray-200 text-gray-800",
  };
  return (
    classes[status || ReadinessStatus.Unknown] || "bg-gray-100 text-gray-800"
  );
};

const reportLinks = [
  {
    name: "Individual Reports",
    description: "View detailed progress for each student.",
    href: "/reports/individual",
    icon: DocumentChartBarIcon,
    color: "bg-blue-500",
  },
  {
    name: "Track Reports",
    description: "Compare progress across a specific track.",
    href: "/reports/track",
    icon: UserGroupIcon,
    color: "bg-purple-500",
  },
  {
    name: "Monthly Report",
    description: "Generate a summary of training activity.",
    href: "/reports/monthly",
    icon: CalendarDaysIcon,
    color: "bg-green-500",
  },
  {
    name: "LLM Report Generation",
    description: "Use AI to generate narrative reports.",
    href: "/reports/llm",
    icon: CpuChipIcon,
    color: "bg-rose-500",
  },
];
</script>
