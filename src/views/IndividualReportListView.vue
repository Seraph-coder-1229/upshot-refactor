<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <ActionHeader
      title="Individual Reports"
      subtitle="Select an individual to view their detailed training report."
    >
      <template #actions>
        <router-link
          :to="{ name: 'Reports' }"
          type="button"
          class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <ArrowLeftIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
          Back to Reports Dashboard
        </router-link>
      </template>
    </ActionHeader>
    <div class="mt-8 flow-root">
      <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div
            class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg"
          >
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Position
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                  >
                    PQS Progress
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-center text-sm font-semibold text-gray-900"
                  >
                    Events Progress
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Readiness Status
                  </th>
                  <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span class="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="person in personnel" :key="person.id">
                  <td
                    class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                  >
                    {{ person.displayName }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {{ person.assignedPosition }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="flex justify-center">
                      <ProgressWheel
                        :progress="person.pqsProgressPercentage ?? 0"
                      />
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div class="flex justify-center">
                      <ProgressWheel
                        :progress="person.eventsProgressPercentage ?? 0"
                      />
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="
                        readinessStatusColor(person.readinessAgainstDeadline)
                      "
                    >
                      {{ person.readinessAgainstDeadline || "Unknown" }}
                    </span>
                  </td>
                  <td
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
                  >
                    <router-link
                      :to="`/student/${person.id}`"
                      class="text-indigo-600 hover:text-indigo-900"
                      >View Report<span class="sr-only"
                        >, {{ person.displayName }}</span
                      ></router-link
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePersonnelStore } from "@/stores/personnelStore";
import { ReadinessStatus } from "@/types/personnelTypes";
import ProgressWheel from "@/components/ui/ProgressWheel.vue";
import ActionHeader from "@/components/ui/ActionHeader.vue";
import { ArrowLeftIcon } from "@heroicons/vue/20/solid";

const personnelStore = usePersonnelStore();
const personnel = computed(() =>
  personnelStore.allPersonnelSortedByName.filter(
    (person) => person.readinessAgainstDeadline !== undefined
  )
);

const readinessStatusColor = (status?: ReadinessStatus) => {
  switch (status) {
    case ReadinessStatus.OnTrack:
      return "bg-green-100 text-green-800";
    case ReadinessStatus.ReadyForNextLevel:
      return "bg-blue-100 text-blue-800";
    case ReadinessStatus.AtRisk:
      return "bg-yellow-100 text-yellow-800";
    case ReadinessStatus.BehindSchedule:
      return "bg-red-100 text-red-800";
    case ReadinessStatus.Blocked:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
</script>
