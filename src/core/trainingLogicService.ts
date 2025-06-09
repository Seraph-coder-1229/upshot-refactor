import { AppConfig } from "@/types/appConfigTypes";
import { ReadinessStatus, type Upgrader } from "../types/personnelTypes";
import {
  type Syllabus,
  RequirementType,
  type Requirement,
  PrioritizedRequirement,
} from "../types/syllabiTypes";
import { addDays, daysBetween, getTodayUtc } from "../utils/dateUtils";
import { arePrerequisitesMet } from "./syllabusLogicService";

/**
 * Calculates the derived PQS and Events working levels for an upgrader
 * based on their completed items against a given syllabus.
 */
export function calculateDerivedWorkingLevels(
  upgrader: Upgrader,
  syllabus: Syllabus
): void {
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  const levelsToCheck = [200, 300, 400];
  let highestPqsLevelCompleted = 0;
  let highestEventsLevelCompleted = 0;

  for (const level of levelsToCheck) {
    // --- CORRECTED PQS LOGIC ---
    // Condition A: Check if all individual PQS items for the level are complete.
    const pqsForLevel = syllabus.requirements.filter(
      (r) => r.level === level && r.type === RequirementType.PQS
    );
    const allIndividualPqsItemsComplete =
      pqsForLevel.length > 0 &&
      pqsForLevel.every((req) =>
        completedEventNames.has(req.name.toUpperCase())
      );

    // Condition B: Check if the ACTC Level itself is marked as complete.
    const actcLevelStatus =
      upgrader.actcLevelData?.[level]?.status?.toUpperCase();
    const isActcLevelComplete = actcLevelStatus === "COMPLETE";

    // If either condition is met, the level is considered complete.
    if (allIndividualPqsItemsComplete || isActcLevelComplete) {
      highestPqsLevelCompleted = level;
    }

    // --- Events Logic (remains the same) ---
    const eventsForLevel = syllabus.requirements.filter(
      (r) => r.level === level && r.type === RequirementType.Event
    );
    const allEventsComplete =
      eventsForLevel.length > 0 &&
      eventsForLevel.every((req) =>
        completedEventNames.has(req.name.toUpperCase())
      );
    if (allEventsComplete) {
      highestEventsLevelCompleted = level;
    }
  }

  // Set the derived working level to the next level up.
  upgrader.derivedPqsWorkingLevel =
    highestPqsLevelCompleted > 0
      ? highestPqsLevelCompleted + 100
      : syllabus.baseLevel;
  upgrader.derivedEventsWorkingLevel =
    highestEventsLevelCompleted > 0
      ? highestEventsLevelCompleted + 100
      : syllabus.baseLevel;
}

/**
 * Calculates the PQS and Event completion percentages for an upgrader's
 * current derived working level.
 */
export function calculateProgressMetrics(
  upgrader: Upgrader,
  syllabus: Syllabus
): void {
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  // Corrected to use upgrader.derivedPqsWorkingLevel and syllabus.baseLevel
  const pqsWorkingLevel = upgrader.derivedPqsWorkingLevel || syllabus.baseLevel;
  console.log(`${upgrader.name} ---->`);
  console.table(upgrader.actcLevelData);
  const pqsForLevel = syllabus.requirements.filter(
    (r) =>
      r.level === pqsWorkingLevel &&
      r.type === RequirementType.PQS &&
      r.isDefaultWaived !== true // Corrected to use r.type
  );
  if (pqsForLevel.length > 0) {
    const completedPqs = pqsForLevel.filter((r) =>
      completedEventNames.has(r.name.toUpperCase())
    );
    upgrader.pqsProgressPercentage =
      (completedPqs.length / pqsForLevel.length) * 100;
  } else {
    upgrader.pqsProgressPercentage = 0;
  }

  // Corrected to use upgrader.derivedEventsWorkingLevel and syllabus.baseLevel
  const eventsWorkingLevel =
    upgrader.derivedEventsWorkingLevel || syllabus.baseLevel;
  const eventsForLevel = syllabus.requirements.filter(
    (r) =>
      r.level === eventsWorkingLevel &&
      r.type === RequirementType.Event &&
      r.isDefaultWaived !== true // Corrected to use r.type
  );
  if (eventsForLevel.length > 0) {
    const completedEvents = eventsForLevel.filter((r) =>
      completedEventNames.has(r.name.toUpperCase())
    );
    upgrader.eventsProgressPercentage =
      (completedEvents.length / eventsForLevel.length) * 100;
  } else {
    upgrader.eventsProgressPercentage = 0;
  }
}

/**
 * NEW FUNCTION FOR 6.1
 * Determines the list of requirements an upgrader has not yet completed for a given syllabus.
 * This function filters out completed items and items that are waived by default.
 *
 * @param upgrader The upgrader whose remaining requirements are to be determined.
 * @param syllabus The syllabus to check against.
 * @returns An array of Requirement objects that are not yet completed and not waived.
 */
export function getRemainingRequirements(
  upgrader: Upgrader,
  syllabus: Syllabus
): Requirement[] {
  if (!upgrader || !syllabus?.requirements) {
    return [];
  }

  // Create a Set of completed requirement names for efficient O(1) lookups.
  // We use the 'name' property as it's the unique identifier from the SHARP export.
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  const remaining = syllabus.requirements.filter((req) => {
    // A requirement is "remaining" if it meets two conditions:
    // 1. It is NOT waived by default.
    const isWaived = req.isDefaultWaived === true;

    // 2. Its name does NOT appear in the set of the upgrader's completed events.
    const isCompleted = completedEventNames.has(req.name.toUpperCase());

    return !isWaived && !isCompleted;
  });

  return remaining;
}

/**
 * Orchestrator function to calculate all pacing metrics for an upgrader.
 * @param upgrader The upgrader to calculate for.
 * @param syllabus The upgrader's assigned syllabus.
 * @param appConfig The application's configuration, containing goal deadlines.
 */
export function calculatePacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  // For waived upgraders, we only calculate against the deadline.
  if (upgrader.onWaiver) {
    upgrader.pacingAgainstTargetDays = undefined; // Not applicable
  } else {
    upgrader.pacingAgainstTargetDays = _calculateTargetPacing(
      upgrader,
      syllabus
    );
  }

  upgrader.pacingAgainstDeadlineDays = _calculateDeadlinePacing(
    upgrader,
    syllabus,
    appConfig
  );
}

/**
 * Calculates the detailed, per-requirement pacing against target dates.
 * @private
 */
function _calculateTargetPacing(
  upgrader: Upgrader,
  syllabus: Syllabus
): number {
  const deltas: number[] = [];

  for (const completion of upgrader.rawCompletions) {
    const requirement = syllabus.requirements.find(
      (r) => r.name.toUpperCase() === completion.event.toUpperCase()
    );

    if (!requirement || requirement.squadronGoalMonths == null) continue;

    const offset = (requirement.goalStartMonthsOffset || 0) * 30;
    const duration = requirement.squadronGoalMonths * 30;
    const targetDate = addDays(upgrader.startDate, offset + duration);

    const delta = daysBetween(completion.date, targetDate);
    deltas.push(delta);
  }

  if (deltas.length === 0) return 0;

  const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return Math.round(averageDelta);
}

/**
 * Calculates the high-level pacing against the final deadline using a slope.
 * @private
 */
function _calculateDeadlinePacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): number {
  const positionKey = upgrader.assignedPosition;
  const level = upgrader.derivedPqsWorkingLevel || syllabus.baseLevel;

  const deadlineMonths =
    appConfig.curveDeadlines[positionKey]?.[level]?.deadlineMonths ||
    syllabus.wingGoalMonths ||
    0;
  if (deadlineMonths === 0) return 0; // Cannot calculate without a deadline

  // 1. Determine the final deadline date, including waiver extension
  const totalDaysForDeadline = deadlineMonths * 30.44; // Avg days in a month
  let finalDeadline = addDays(upgrader.startDate, totalDaysForDeadline);
  if (upgrader.onWaiver) {
    finalDeadline = addDays(finalDeadline, 90);
  }

  // 2. Calculate total time and elapsed time
  const totalTimeInDays = daysBetween(upgrader.startDate, finalDeadline);
  const elapsedTimeInDays = daysBetween(upgrader.startDate, getTodayUtc());

  if (totalTimeInDays <= 0 || elapsedTimeInDays < 0) return 0;

  // 3. Calculate expected progress
  const expectedProgressPercent = Math.min(
    elapsedTimeInDays / totalTimeInDays,
    1
  );
  const totalRequirements = syllabus.requirements.filter(
    (r) => !r.isDefaultWaived
  ).length;
  const expectedCompletions = totalRequirements * expectedProgressPercent;

  // 4. Compare actual vs. expected
  const actualCompletions = upgrader.rawCompletions.length;
  const completionDelta = actualCompletions - expectedCompletions;

  // 5. Convert the difference in number of items to an estimated number of days
  const completionRatePerDay = totalRequirements / totalTimeInDays;
  const daysAheadBehind = completionDelta / completionRatePerDay;

  return Math.round(daysAheadBehind);
}

/**
 * Calculates a prioritized "to-do list" of remaining requirements for a single upgrader.
 * @param upgrader The upgrader to calculate for.
 * @param syllabus The upgrader's assigned syllabus.
 * @returns A sorted array of PrioritizedRequirement objects.
 */
export function getPrioritizedRequirements(
  upgrader: Upgrader,
  syllabus: Syllabus
): PrioritizedRequirement[] {
  const remaining = getRemainingRequirements(upgrader, syllabus);
  const allRequirementNames = new Set(syllabus.requirements.map((r) => r.name));

  // First, create a map of how many items each requirement unlocks
  const unlockMap = new Map<string, number>();
  for (const req of syllabus.requirements) {
    if (req.prerequisites) {
      for (const prereq of req.prerequisites) {
        unlockMap.set(prereq, (unlockMap.get(prereq) || 0) + 1);
      }
    }
  }

  const prioritizedList: PrioritizedRequirement[] = remaining.map((req) => {
    let priorityScore = 0;
    const isAvailable = arePrerequisitesMet(req, upgrader);
    const unlocks = unlockMap.get(req.name) || 0;

    // Availability is the most important factor
    if (isAvailable) {
      priorityScore += 1000;
    }

    // Unlocking other items is the next most important
    priorityScore += unlocks * 50;

    // Lower sequence numbers are higher priority
    if (req.sequence) {
      priorityScore += 100 - req.sequence;
    }

    return {
      ...req,
      priorityScore,
      isAvailable,
      unlocks,
    };
  });

  // Sort by score, highest first
  return prioritizedList.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Creates a sorted "watch list" of upgraders who need the most attention.
 * @param upgraders The list of upgraders to prioritize.
 * @param syllabus The syllabus they are on.
 * @returns A sorted array of Upgrader objects.
 */
export function getPrioritizedUpgraders(
  upgraders: Upgrader[],
  syllabus: Syllabus
): Upgrader[] {
  const scoredUpgraders = upgraders.map((u) => {
    let priorityScore = 0;

    // Factor 1: How far behind schedule are they?
    if (u.pacingAgainstDeadlineDays && u.pacingAgainstDeadlineDays < 0) {
      // The more negative the number, the higher the score
      priorityScore += Math.abs(u.pacingAgainstDeadlineDays);
    }

    // Factor 2: Are they blocked (zero available tasks)? This is a major flag.
    const remaining = getRemainingRequirements(u, syllabus);
    const availableTasks = remaining.filter((req) =>
      arePrerequisitesMet(req, u)
    );
    if (availableTasks.length === 0 && remaining.length > 0) {
      priorityScore += 1000; // High penalty for being blocked
    }

    // Return the upgrader with their calculated score
    return { ...u, priorityScore };
  });

  // Sort by score, highest first
  return scoredUpgraders.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * NEW FUNCTION FOR 6.4
 * Calculates projected completion dates for PQS, Events, and the total syllabus.
 * @param upgrader The upgrader to calculate for.
 * @param syllabus The upgrader's assigned syllabus.
 */
export function calculateProjections(
  upgrader: Upgrader,
  syllabus: Syllabus
): void {
  const today = getTodayUtc();
  const COMPLETION_THRESHOLD = 3; // Min completions needed to establish a personal velocity

  // Helper function to calculate velocity for a given requirement type
  const calculateVelocity = (reqType: RequirementType): number => {
    const completions = upgrader.rawCompletions
      .map((c) => {
        const req = syllabus.requirements.find(
          (r) => r.name.toUpperCase() === c.event.toUpperCase()
        );
        return { ...c, req };
      })
      .filter((c) => c.req?.type === reqType)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (completions.length >= COMPLETION_THRESHOLD) {
      const firstDate = completions[0].date;
      const lastDate = completions[completions.length - 1].date;
      const timeSpan = daysBetween(firstDate, lastDate);

      if (timeSpan > 0) {
        const totalDifficulty = completions.reduce(
          (sum, c) => sum + (c.req?.difficulty || 1),
          0
        );
        return totalDifficulty / timeSpan; // difficulty points per day
      }
    }

    // Default rate calculation if not enough history
    const requirementsOfType = syllabus.requirements.filter(
      (r) => r.type === reqType && !r.isDefaultWaived
    );
    const totalDifficulty = requirementsOfType.reduce(
      (sum, r) => sum + (r.difficulty || 1),
      0
    );
    const goalDays = (syllabus.wingGoalMonths || 12) * 30.44; // Use squadronGoal as the baseline

    return goalDays > 0 ? totalDifficulty / goalDays : 0.1; // Fallback to a slow velocity
  };

  const pqsVelocity = calculateVelocity(RequirementType.PQS);
  const eventsVelocity = calculateVelocity(RequirementType.Event);

  const remainingRequirements = getRemainingRequirements(upgrader, syllabus);

  // Project PQS completion
  const remainingPqsDifficulty = remainingRequirements
    .filter((r) => r.type === RequirementType.PQS)
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);

  if (pqsVelocity > 0) {
    const daysToCompletePqs = remainingPqsDifficulty / pqsVelocity;
    upgrader.projectedPqsCompletionDate = addDays(today, daysToCompletePqs);
  }

  // Project Events completion
  const remainingEventsDifficulty = remainingRequirements
    .filter(
      (r) =>
        r.type === RequirementType.Event || r.type === RequirementType.Board
    ) // Include Boards in Events projection
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);

  if (eventsVelocity > 0) {
    const daysToCompleteEvents = remainingEventsDifficulty / eventsVelocity;
    upgrader.projectedEventsCompletionDate = addDays(
      today,
      daysToCompleteEvents
    );
  }

  // Determine total completion date
  const pqsDate = upgrader.projectedPqsCompletionDate?.getTime() || 0;
  const eventsDate = upgrader.projectedEventsCompletionDate?.getTime() || 0;
  if (pqsDate > 0 || eventsDate > 0) {
    upgrader.projectedTotalCompletionDate = new Date(
      Math.max(pqsDate, eventsDate)
    );
  }
}

/**
 * Helper function to determine a readiness status based on a pacing value.
 */
function _getReadinessFromPacing(
  pacingDays: number | undefined
): ReadinessStatus {
  if (pacingDays == null) return ReadinessStatus.Unknown;
  if (pacingDays < -30) return ReadinessStatus.BehindSchedule;
  if (pacingDays < 0) return ReadinessStatus.AtRisk;
  return ReadinessStatus.OnTrack;
}

/**
 * Calculates the overall readiness status for an upgrader.
 * @param upgrader The upgrader to calculate for.
 * @param syllabus The upgrader's assigned syllabus.
 */
export function calculateReadiness(
  upgrader: Upgrader,
  syllabus: Syllabus
): void {
  // Check for the highest precedence status: Blocked
  const remaining = getRemainingRequirements(upgrader, syllabus);
  if (remaining.length > 0) {
    const availableTasks = remaining.filter((req) =>
      arePrerequisitesMet(req, upgrader)
    );
    if (availableTasks.length === 0) {
      // If they have work left but nothing is available, they are blocked.
      // This overrides any pacing-based status.
      upgrader.readinessAgainstTarget = ReadinessStatus.Blocked;
      upgrader.readinessAgainstDeadline = ReadinessStatus.Blocked;
      return;
    }
  }

  // Check if they are ready for the next level
  if (
    upgrader.derivedPqsWorkingLevel &&
    upgrader.targetQualificationLevel &&
    upgrader.derivedPqsWorkingLevel > upgrader.targetQualificationLevel
  ) {
    upgrader.readinessAgainstTarget = ReadinessStatus.ReadyForNextLevel;
    upgrader.readinessAgainstDeadline = ReadinessStatus.ReadyForNextLevel;
    return;
  }

  // If not blocked or ready for next, calculate based on pacing.
  upgrader.readinessAgainstTarget = _getReadinessFromPacing(
    upgrader.pacingAgainstTargetDays
  );
  upgrader.readinessAgainstDeadline = _getReadinessFromPacing(
    upgrader.pacingAgainstDeadlineDays
  );
}
