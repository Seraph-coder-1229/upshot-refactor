<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">PQS Progress for Level {{ level }}</h2>
      <TrackLevelChart
        v-if="pqsUpgradersForThisLevel.length > 0"
        :upgraders="pqsUpgradersForThisLevel"
        :level="level"
        :chart-type="RequirementType.PQS"
      />
      <p v-else class="text-gray-500 mt-2">
        No upgraders are currently working on this PQS level.
      </p>
    </div>
    <div>
      <h2 class="text-xl font-semibold">
        Event Progress for Level {{ level }}
      </h2>
      <TrackLevelChart
        v-if="eventUpgradersForThisLevel.length > 0"
        :upgraders="eventUpgradersForThisLevel"
        :level="level"
        :chart-type="RequirementType.Event"
      />
      <p v-else class="text-gray-500 mt-2">
        No upgraders are currently working on this Event level.
      </p>
    </div>
    <div>
      <h2 class="text-xl font-semibold">Upgrader Watch List (Entire Track)</h2>
      <div v-if="prioritizedUpgraders.length > 0">
        <ul>
          <li
            v-for="upgrader in prioritizedUpgraders"
            :key="upgrader.id"
            class="border-b py-2"
          >
            <p>
              <strong>{{ upgrader.displayName }}</strong> (Working PQS:
              {{
                getWorkingLevel(
                  upgrader.derivedPqsWorkingLevel,
                  syllabus?.baseLevel
                )
              }}, Events:
              {{
                getWorkingLevel(
                  upgrader.derivedEventsWorkingLevel,
                  syllabus?.baseLevel
                )
              }})
            </p>
            <p
              v-if="upgrader.readinessAgainstDeadline === 'Blocked'"
              class="text-red-500 font-semibold"
            >
              Status: Blocked
            </p>
            <p
              v-if="
                upgrader.pacingAgainstDeadlineDays &&
                upgrader.pacingAgainstDeadlineDays < 0
              "
              class="text-sm text-yellow-600"
            >
              Pacing: {{ upgrader.pacingAgainstDeadlineDays }} days against
              deadline
            </p>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>No upgraders are currently on the watch list for this track.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, defineProps } from "vue";
import type { Upgrader } from "@/types/personnelTypes";
import { getPrioritizedUpgraders } from "@/core/trainingLogicService";
import { useSyllabiStore } from "@/stores/syllabiStore";
import { RequirementType, type Syllabus } from "@/types/syllabiTypes";
import TrackLevelChart from "../charts/TrackLevelChart.vue";

const props = defineProps({
  upgraders: {
    type: Array as PropType<Upgrader[]>,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
});

const syllabiStore = useSyllabiStore();

const syllabus = computed<Syllabus | undefined>(() =>
  syllabiStore.findSyllabus(props.position, props.year)
);

const getWorkingLevel = (
  level: string | undefined | number,
  baseLevel: string | undefined | number
): string => {
  const levelStr = level ? String(level).trim() : "";
  if (levelStr && levelStr !== "undefined") {
    return levelStr;
  }
  return baseLevel ? String(baseLevel).trim() : "";
};

const pqsUpgradersForThisLevel = computed(() => {
  if (!syllabus.value) return [];
  return props.upgraders.filter(
    (u) =>
      getWorkingLevel(u.derivedPqsWorkingLevel, syllabus.value?.baseLevel) ===
      props.level.trim()
  );
});

const eventUpgradersForThisLevel = computed(() => {
  if (!syllabus.value) return [];
  return props.upgraders.filter(
    (u) =>
      getWorkingLevel(
        u.derivedEventsWorkingLevel,
        syllabus.value?.baseLevel
      ) === props.level.trim()
  );
});

const prioritizedUpgraders = computed(() => {
  if (!props.upgraders || props.upgraders.length === 0 || !syllabus.value)
    return [];
  const scored = getPrioritizedUpgraders(props.upgraders, syllabus.value);
  return scored.filter((u) => u.priorityScore > 0);
});
</script>
