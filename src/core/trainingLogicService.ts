// src/core/trainingLogicService.ts

import { type Upgrader, ReadinessStatus } from "../types/personnelTypes";
import {
  type Syllabus,
  type Requirement,
  type PrioritizedRequirement,
  RequirementType,
  CompletedItemRecord,
} from "../types/syllabiTypes";
import { type AppConfig } from "../types/appConfigTypes";
import { addDays, daysBetween, getTodayUtc } from "../utils/dateUtils";
import {
  arePrerequisitesMet,
  isRequirementWaived,
} from "./syllabusLogicService";

/**
 * Transforms raw completion data into a structured array of CompletedItemRecord
 * by resolving it against a syllabus.
 */
function _resolveCompletionsFromRawData(
  upgrader: Upgrader,
  syllabus: Syllabus
): CompletedItemRecord[] {
  const resolved: CompletedItemRecord[] = [];
  if (!syllabus?.requirements) return resolved;

  const requirementsMap = new Map(
    syllabus.requirements.map((req) => [req.name.toUpperCase(), req])
  );
  const completionsSet = new Set<string>();

  // Process actual completions
  if (upgrader.rawCompletions) {
    for (const raw of upgrader.rawCompletions) {
      const key = raw.event.toUpperCase();
      const requirement = requirementsMap.get(key);
      if (requirement) {
        resolved.push({
          requirementId: requirement.id,
          requirementDisplayName: requirement.displayName,
          requirementType: requirement.type,
          completionDate: raw.date,
          isActualCompletion: true,
          isSyllabusWaived: false,
          grade: raw.grade,
          instructor: raw.instructor,
          statusRaw: raw.status,
        });
        completionsSet.add(key);
      }
    }
  }

  // Process requirements that are considered complete because they are waived
  for (const requirement of syllabus.requirements) {
    const key = requirement.name.toUpperCase();
    if (
      !completionsSet.has(key) &&
      isRequirementWaived(requirement, upgrader)
    ) {
      resolved.push({
        requirementId: requirement.id,
        requirementDisplayName: requirement.displayName,
        requirementType: requirement.type,
        completionDate: upgrader.startDate, // Use a placeholder date
        isActualCompletion: false,
        isSyllabusWaived: true,
      });
    }
  }
  return resolved;
}

export function getRemainingRequirements(
  upgrader: Upgrader,
  syllabus: Syllabus
): Requirement[] {
  if (!upgrader || !syllabus?.requirements) return [];

  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  // Get the upgrader's target level (e.g., 300)
  const targetLevel = upgrader.targetQualificationLevel;

  return syllabus.requirements.filter((req) => {
    const waived = isRequirementWaived(req, upgrader);
    const completed = completedEventNames.has(req.name.toUpperCase());

    // NEW: Parse the requirement's level and compare it to the target
    const requirementLevel = parseInt(req.level, 10);
    const isBelowTarget = requirementLevel <= targetLevel;

    return !waived && !completed && isBelowTarget;
  });
}

export function calculateDerivedWorkingLevels(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  const useDerivedLevels =
    appConfig.positionSettings[upgrader.assignedPosition]?.useDerivedLevels ===
    true;

  if (!useDerivedLevels) {
    upgrader.derivedPqsWorkingLevel = String(
      upgrader.targetQualificationLevel
    ).trim();
    upgrader.derivedEventsWorkingLevel = String(
      upgrader.targetQualificationLevel
    ).trim();
    return;
  }

  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  const levelsToCheck = Array.from(
    new Set(syllabus.requirements.map((r) => String(r.level).trim()))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let highestPqsLevelCompleted = "0";

  for (const level of levelsToCheck) {
    const isUnlocked =
      parseInt(level) < 400 ||
      upgrader.manuallyUnlockedLevels?.includes(parseInt(level));
    if (!isUnlocked) continue;

    const pqsForLevel = syllabus.requirements.filter(
      (r) =>
        String(r.level).trim() === level &&
        r.type === RequirementType.PQS &&
        !isRequirementWaived(r, upgrader)
    );
    const allIndividualPqsItemsComplete =
      pqsForLevel.length > 0 &&
      pqsForLevel.every((req) =>
        completedEventNames.has(req.name.toUpperCase())
      );
    const actcLevelStatus =
      upgrader.actcLevelData?.[level]?.status?.toUpperCase();
    const isActcLevelComplete =
      actcLevelStatus === "COMPLETE" || actcLevelStatus === "ACTIVE";

    if (allIndividualPqsItemsComplete || isActcLevelComplete) {
      highestPqsLevelCompleted = level;
    }
  }

  const nextLevelIndex = levelsToCheck.indexOf(highestPqsLevelCompleted) + 1;
  const nextLevel =
    nextLevelIndex < levelsToCheck.length
      ? levelsToCheck[nextLevelIndex]
      : highestPqsLevelCompleted;

  let finalWorkingLevel =
    highestPqsLevelCompleted !== "0"
      ? nextLevel
      : String(syllabus.baseLevel).trim();

  if (parseInt(finalWorkingLevel) >= 400) {
    finalWorkingLevel = highestPqsLevelCompleted;
  }

  upgrader.derivedPqsWorkingLevel = finalWorkingLevel;
  upgrader.derivedEventsWorkingLevel = finalWorkingLevel;
}

export function calculateProgressMetrics(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  const today = getTodayUtc();
  const settings = appConfig.positionSettings[upgrader.assignedPosition];
  if (!settings) return;

  const deadlineSetting = settings.deadlines[upgrader.targetQualificationLevel];
  if (!deadlineSetting) {
    upgrader.idealCompletionDate = undefined;
    upgrader.finalDeadline = undefined;
  } else {
    upgrader.idealCompletionDate = addDays(
      upgrader.startDate,
      Math.round(deadlineSetting.targetMonths * 30.44)
    );
    upgrader.finalDeadline = addDays(
      upgrader.startDate,
      Math.round(deadlineSetting.deadlineMonths * 30.44)
    );
  }

  const elapsedDays = daysBetween(upgrader.startDate, today);
  if (elapsedDays <= 0) {
    // Handles students that haven't started or have bad data
    upgrader.pqsProgressPercentage = 0;
    upgrader.eventsProgressPercentage = 0;
    return;
  }

  const completions = upgrader.allCompletions.filter(
    (c) => c.isActualCompletion
  );
  const remainingRequirements = getRemainingRequirements(
    upgrader,
    syllabus
  ).length;

  // --- REVISED RATE CALCULATION ---
  // Prioritize recent activity (last 90 days) for a more accurate "current pace".
  const recentWindowDays = 90;
  const recentCompletions = completions.filter(
    (c) => daysBetween(c.completionDate, today) <= recentWindowDays
  ).length;

  let dailyRate = 0;
  // Use recent rate only if there's significant activity, otherwise use overall average.
  if (recentCompletions > 2 && elapsedDays > recentWindowDays) {
    dailyRate = recentCompletions / recentWindowDays;
  } else {
    dailyRate = completions.length / elapsedDays;
  }

  if (dailyRate > 0) {
    const daysToComplete = remainingRequirements / dailyRate;
    upgrader.projectedTotalCompletionDate = addDays(
      today,
      Math.round(daysToComplete)
    );
  } else {
    upgrader.projectedTotalCompletionDate = undefined;
  }

  // --- CORRECTED PACING CALCULATION ---
  // Pacing = Deadline Date - Projected Date. Positive is ahead, negative is behind.
  if (upgrader.projectedTotalCompletionDate && upgrader.finalDeadline) {
    upgrader.pacingAgainstDeadlineDays = daysBetween(
      upgrader.finalDeadline,
      upgrader.projectedTotalCompletionDate
    );
  }
  if (upgrader.projectedTotalCompletionDate && upgrader.idealCompletionDate) {
    upgrader.pacingAgainstTargetDays = daysBetween(
      upgrader.idealCompletionDate,
      upgrader.projectedTotalCompletionDate
    );
  }
  const targetLevel = upgrader.targetQualificationLevel;
  const relevantRequirements = syllabus.requirements.filter(
    (req) => parseInt(req.level, 10) <= targetLevel
  );

  // --- START OF PERCENTAGE FIX ---
  // Create a Set of relevant requirement IDs for efficient lookup.
  const relevantPqsIds = new Set(
    relevantRequirements
      .filter((r) => r.type === RequirementType.PQS && !r.isDefaultWaived)
      .map((r) => r.id)
  );
  const relevantEventIds = new Set(
    relevantRequirements
      .filter((r) => r.type === RequirementType.Event && !r.isDefaultWaived)
      .map((r) => r.id)
  );

  const pqsItems = relevantPqsIds.size;
  const eventItems = relevantEventIds.size;

  if (pqsItems > 0) {
    // Only count completions that are in the relevant set.
    const pqsCompleted = completions.filter(
      (c) =>
        c.requirementType === RequirementType.PQS &&
        relevantPqsIds.has(c.requirementId)
    ).length;
    upgrader.pqsProgressPercentage = (pqsCompleted / pqsItems) * 100;
  } else {
    upgrader.pqsProgressPercentage = 100;
  }

  if (eventItems > 0) {
    // Only count completions that are in the relevant set.
    const eventsCompleted = completions.filter(
      (c) =>
        c.requirementType === RequirementType.Event &&
        relevantEventIds.has(c.requirementId)
    ).length;
    upgrader.eventsProgressPercentage = (eventsCompleted / eventItems) * 100;
  } else {
    upgrader.eventsProgressPercentage = 100;
  }
}

/**
 * Calculates the number of events/PQS items an upgrader needs to complete
 * to meet their deadline and ideal timelines, separated by type.
 */
function _calculateItemsToMeetMilestones(
  upgrader: Upgrader,
  syllabus: Syllabus
): {
  eventsToMeetDeadline?: number;
  pqsToMeetDeadline?: number;
  eventsToMeetIdeal?: number;
  pqsToMeetIdeal?: number;
} {
  const {
    startDate,
    finalDeadline,
    idealCompletionDate,
    pacingAgainstDeadlineDays,
    pacingAgainstTargetDays,
  } = upgrader;

  if (!startDate || !finalDeadline || !idealCompletionDate) {
    return {};
  }

  const allNonWaived = syllabus.requirements.filter(
    (r) => !isRequirementWaived(r, upgrader)
  );
  const totalEventDifficulty = allNonWaived
    .filter((r) => r.type === RequirementType.Event)
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);
  const totalPqsDifficulty = allNonWaived
    .filter((r) => r.type === RequirementType.PQS)
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);

  const deadlineDuration = daysBetween(startDate, finalDeadline);
  const idealDuration = daysBetween(startDate, idealCompletionDate);

  // Velocity is difficulty points per day
  const eventVelocityForDeadline =
    deadlineDuration > 0 ? totalEventDifficulty / deadlineDuration : 0;
  const pqsVelocityForDeadline =
    deadlineDuration > 0 ? totalPqsDifficulty / deadlineDuration : 0;
  const eventVelocityForIdeal =
    idealDuration > 0 ? totalEventDifficulty / idealDuration : 0;
  const pqsVelocityForIdeal =
    idealDuration > 0 ? totalPqsDifficulty / idealDuration : 0;

  let eventsToMeetDeadline: number | undefined = 0;
  let pqsToMeetDeadline: number | undefined = 0;
  if (pacingAgainstDeadlineDays && pacingAgainstDeadlineDays < 0) {
    const days = Math.abs(pacingAgainstDeadlineDays);
    eventsToMeetDeadline = Math.ceil(days * eventVelocityForDeadline);
    pqsToMeetDeadline = Math.ceil(days * pqsVelocityForDeadline);
  }

  let eventsToMeetIdeal: number | undefined = 0;
  let pqsToMeetIdeal: number | undefined = 0;
  if (pacingAgainstTargetDays && pacingAgainstDeadlineDays! < 0) {
    const days = Math.abs(pacingAgainstTargetDays);
    eventsToMeetIdeal = Math.ceil(days * eventVelocityForIdeal);
    pqsToMeetIdeal = Math.ceil(days * pqsVelocityForIdeal);
  }

  return {
    eventsToMeetDeadline,
    pqsToMeetDeadline,
    eventsToMeetIdeal,
    pqsToMeetIdeal,
  };
}

function _calculateIdealPacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig,
  totalNonWaivedDifficulty: number
): { idealPacing: number | undefined; idealCompletionDate: Date | undefined } {
  const positionSettings =
    appConfig.positionSettings[upgrader.assignedPosition];
  const targetMonths =
    positionSettings?.deadlines[syllabus.baseLevel]?.targetMonths;

  if (!targetMonths) {
    return { idealPacing: undefined, idealCompletionDate: undefined };
  }

  const idealCompletionDate = addDays(upgrader.startDate, targetMonths * 30.44);
  const totalTimeInDays = daysBetween(upgrader.startDate, idealCompletionDate);
  const elapsedTimeInDays = daysBetween(upgrader.startDate, getTodayUtc());

  if (totalTimeInDays <= 0 || elapsedTimeInDays < 0) {
    return { idealPacing: 0, idealCompletionDate };
  }

  const expectedProgressPercent = Math.min(
    elapsedTimeInDays / totalTimeInDays,
    1
  );
  const expectedCompletionDifficulty =
    totalNonWaivedDifficulty * expectedProgressPercent;

  const actualCompletionDifficulty = upgrader.rawCompletions
    .map((c) =>
      syllabus.requirements.find(
        (r) => r.name.toUpperCase() === c.event.toUpperCase()
      )
    )
    .reduce((sum, r) => sum + (r?.difficulty || 1), 0);

  const completionDelta =
    actualCompletionDifficulty - expectedCompletionDifficulty;
  const completionRatePerDay =
    totalTimeInDays > 0 ? totalNonWaivedDifficulty / totalTimeInDays : 0;

  const idealPacing =
    completionRatePerDay > 0
      ? Math.round(completionDelta / completionRatePerDay)
      : 0;
  return { idealPacing, idealCompletionDate };
}

/**
 * Calculates a "cost factor" for an upgrader (0-100).
 * Higher values indicate more effort is needed to get the upgrader proficient.
 */
function _calculateCostFactor(
  upgrader: Upgrader,
  syllabus: Syllabus, // Pass syllabus in
  totalNonWaivedDifficulty: number
): number | undefined {
  if (
    upgrader.pacingAgainstDeadlineDays === undefined ||
    !upgrader.finalDeadline
  ) {
    return undefined;
  }

  // 1. Pacing Component (40%): How far behind are they?
  const daysBehind = Math.max(0, -upgrader.pacingAgainstDeadlineDays);
  const pacingScore = Math.min(daysBehind / 180, 1); // Normalize (capped at 180 days)

  // 2. Workload Component (40%): How much work is left?
  const completedDifficulty = upgrader.rawCompletions
    .map((c) =>
      syllabus.requirements.find(
        (r) => r.name.toUpperCase() === c.event.toUpperCase()
      )
    )
    .reduce((sum, r) => sum + (r?.difficulty || 1), 0);
  const remainingDifficulty = totalNonWaivedDifficulty - completedDifficulty;
  const workloadScore =
    remainingDifficulty > 0 && totalNonWaivedDifficulty > 0
      ? remainingDifficulty / totalNonWaivedDifficulty
      : 0;

  // 3. Timeline Pressure Component (20%): How much time is left?
  const daysRemaining = daysBetween(new Date(), upgrader.finalDeadline);
  const timelineScore = 1 - Math.min(Math.max(0, daysRemaining) / (365 * 2), 1);

  const costFactor =
    (pacingScore * 0.4 + workloadScore * 0.4 + timelineScore * 0.2) * 100;
  return Math.round(costFactor);
}

function _calculateDeadlinePacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): { pacing: number | undefined; finalDeadline: Date | undefined } {
  const positionKey = upgrader.assignedPosition;
  const level = upgrader.derivedPqsWorkingLevel || syllabus.baseLevel;
  const deadlineMonths =
    appConfig.positionSettings[positionKey]?.deadlines[level]?.deadlineMonths ||
    0;

  if (deadlineMonths === 0)
    return { pacing: undefined, finalDeadline: undefined };

  let finalDeadline = addDays(upgrader.startDate, deadlineMonths * 30.44);
  if (upgrader.onWaiver) finalDeadline = addDays(finalDeadline, 90);

  const totalTimeInDays = daysBetween(upgrader.startDate, finalDeadline);
  const elapsedTimeInDays = daysBetween(upgrader.startDate, getTodayUtc());
  if (totalTimeInDays <= 0 || elapsedTimeInDays < 0)
    return { pacing: 0, finalDeadline };

  const expectedProgressPercent = Math.min(
    elapsedTimeInDays / totalTimeInDays,
    1
  );

  const totalRequirements = syllabus.requirements
    .filter((r) => !isRequirementWaived(r, upgrader))
    .reduce((sum, r) => sum + (r.difficulty || 1), 1); // Use difficulty

  const expectedCompletions = totalRequirements * expectedProgressPercent;

  const actualCompletions = upgrader.rawCompletions
    .map((c) =>
      syllabus.requirements.find(
        (r) => r.name.toUpperCase() === c.event.toUpperCase()
      )
    )
    .reduce((sum, r) => sum + (r?.difficulty || 1), 0);

  const completionDelta = actualCompletions - expectedCompletions;
  const completionRatePerDay =
    totalTimeInDays > 0 ? totalRequirements / totalTimeInDays : 0;

  const pacing =
    completionRatePerDay > 0
      ? Math.round(completionDelta / completionRatePerDay)
      : 0;

  return { pacing, finalDeadline };
}

export function calculatePacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  const totalNonWaivedDifficulty = syllabus.requirements
    .filter((r) => !isRequirementWaived(r, upgrader))
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);

  // Calculate Pacing and Deadlines
  const { idealPacing, idealCompletionDate } = _calculateIdealPacing(
    upgrader,
    syllabus,
    appConfig,
    totalNonWaivedDifficulty
  );
  upgrader.pacingAgainstTargetDays = idealPacing;
  upgrader.idealCompletionDate = idealCompletionDate;

  const { pacing: deadlinePacing, finalDeadline } = _calculateDeadlinePacing(
    upgrader,
    syllabus,
    appConfig
  );
  upgrader.pacingAgainstDeadlineDays = deadlinePacing;
  upgrader.finalDeadline = finalDeadline;

  // Calculate items to meet milestones
  const {
    eventsToMeetDeadline,
    pqsToMeetDeadline,
    eventsToMeetIdeal,
    pqsToMeetIdeal,
  } = _calculateItemsToMeetMilestones(upgrader, syllabus);
  upgrader.eventsToMeetDeadline = eventsToMeetDeadline;
  upgrader.pqsToMeetDeadline = pqsToMeetDeadline;
  upgrader.eventsToMeetIdeal = eventsToMeetIdeal;
  upgrader.pqsToMeetIdeal = pqsToMeetIdeal;

  // Calculate the cost factor
  upgrader.costFactor = _calculateCostFactor(
    upgrader,
    syllabus,
    totalNonWaivedDifficulty
  );

  upgrader.pacingAgainstTargetDays = upgrader.onWaiver
    ? undefined
    : idealPacing;
}

// No changes to calculateProjections, _getReadinessFromPacing, calculateReadiness, getPrioritizedRequirements, getPrioritizedUpgraders
export function calculateProjections(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  const today = getTodayUtc();
  const COMPLETION_THRESHOLD = 3;

  const calculateVelocity = (reqType: RequirementType): number => {
    const completions = upgrader.rawCompletions
      .map((c) => ({
        ...c,
        req: syllabus.requirements.find(
          (r) => r.name.toUpperCase() === c.event.toUpperCase()
        ),
      }))
      .filter((c) => c.req?.type === reqType)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (completions.length >= COMPLETION_THRESHOLD) {
      const timeSpan = daysBetween(
        completions[0].date,
        completions[completions.length - 1].date
      );
      if (timeSpan > 0) {
        const totalDifficulty = completions.reduce(
          (sum, c) => sum + (c.req?.difficulty || 1),
          0
        );
        return totalDifficulty / timeSpan;
      }
    }
    const requirementsOfType = syllabus.requirements.filter(
      (r) => r.type === reqType && !r.isDefaultWaived
    );
    const totalDifficulty = requirementsOfType.reduce(
      (sum, r) => sum + (r.difficulty || 1),
      0
    );
    const goalMonths =
      appConfig.positionSettings[upgrader.assignedPosition]?.deadlines[
        syllabus.baseLevel
      ]?.targetMonths || 12;
    const goalDays = goalMonths * 30.44;
    return goalDays > 0 ? totalDifficulty / goalDays : 0.1;
  };

  const pqsVelocity = calculateVelocity(RequirementType.PQS);
  const eventsVelocity = calculateVelocity(RequirementType.Event);
  const remaining = getRemainingRequirements(upgrader, syllabus);

  const remainingPqsDifficulty = remaining
    .filter((r) => r.type === RequirementType.PQS)
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);
  if (pqsVelocity > 0) {
    upgrader.projectedPqsCompletionDate = addDays(
      today,
      remainingPqsDifficulty / pqsVelocity
    );
  } else {
    upgrader.projectedPqsCompletionDate = undefined;
  }

  const remainingEventsDifficulty = remaining
    .filter(
      (r) =>
        r.type === RequirementType.Event || r.type === RequirementType.Board
    )
    .reduce((sum, r) => sum + (r.difficulty || 1), 0);
  if (eventsVelocity > 0) {
    upgrader.projectedEventsCompletionDate = addDays(
      today,
      remainingEventsDifficulty / eventsVelocity
    );
  } else {
    upgrader.projectedEventsCompletionDate = undefined;
  }

  const pqsDate = upgrader.projectedPqsCompletionDate?.getTime() || 0;
  const eventsDate = upgrader.projectedEventsCompletionDate?.getTime() || 0;
  if (pqsDate > 0 || eventsDate > 0) {
    upgrader.projectedTotalCompletionDate = new Date(
      Math.max(pqsDate, eventsDate)
    );
  } else {
    upgrader.projectedTotalCompletionDate = undefined;
  }
}

function _getReadinessFromPacing(pacingDays?: number): ReadinessStatus {
  if (pacingDays == null) return ReadinessStatus.Unknown;
  if (pacingDays < -30) return ReadinessStatus.BehindSchedule;
  if (pacingDays < 0) return ReadinessStatus.AtRisk;
  return ReadinessStatus.OnTrack;
}

export function calculateReadiness(
  upgrader: Upgrader,
  syllabus: Syllabus
): void {
  const remaining = getRemainingRequirements(upgrader, syllabus);
  if (
    remaining.length > 0 &&
    remaining.every((req) => !arePrerequisitesMet(req, upgrader))
  ) {
    upgrader.readinessAgainstTarget = ReadinessStatus.Blocked;
    upgrader.readinessAgainstDeadline = ReadinessStatus.Blocked;
    return;
  }

  const numericDerivedLevel = parseInt(upgrader.derivedPqsWorkingLevel || "0");
  if (numericDerivedLevel > upgrader.targetQualificationLevel) {
    upgrader.readinessAgainstTarget = ReadinessStatus.ReadyForNextLevel;
    upgrader.readinessAgainstDeadline = ReadinessStatus.ReadyForNextLevel;
    return;
  }

  upgrader.readinessAgainstTarget = _getReadinessFromPacing(
    upgrader.pacingAgainstTargetDays
  );
  upgrader.readinessAgainstDeadline = _getReadinessFromPacing(
    upgrader.pacingAgainstDeadlineDays
  );
  console.log(
    `[Metrics] Readiness for ${upgrader.displayName} - Target: ${
      upgrader.readinessAgainstTarget
    }, Deadline: ${upgrader.readinessAgainstDeadline}, PacingTargetDays: ${
      upgrader.pacingAgainstTargetDays
    }, PacingDeadlineDays: ${
      upgrader.pacingAgainstDeadlineDays
    }, Current Days: ${daysBetween(upgrader.startDate, getTodayUtc())}`
  );
}

export function getPrioritizedRequirements(
  upgrader: Upgrader,
  syllabus: Syllabus
): PrioritizedRequirement[] {
  const allRemaining = getRemainingRequirements(upgrader, syllabus);

  const workingLevel = upgrader.derivedPqsWorkingLevel || syllabus.baseLevel;
  const remainingForLevel = allRemaining.filter(
    (r) => String(r.level) === workingLevel
  );

  const unlockMap = new Map<string, number>();
  syllabus.requirements.forEach((req) =>
    req.prerequisites?.forEach((prereq) =>
      unlockMap.set(prereq, (unlockMap.get(prereq) || 0) + 1)
    )
  );

  const prioritizedList: PrioritizedRequirement[] = remainingForLevel.map(
    (req) => {
      let priorityScore = 0;
      const isAvailable = arePrerequisitesMet(req, upgrader);
      if (isAvailable) priorityScore += 1000;
      priorityScore += (unlockMap.get(req.name) || 0) * 50;
      if (req.sequence) priorityScore += 100 - req.sequence;
      return {
        ...req,
        priorityScore,
        isAvailable,
        unlocks: unlockMap.get(req.name) || 0,
      };
    }
  );

  return prioritizedList.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getPrioritizedUpgraders(
  upgraders: Upgrader[],
  syllabus: Syllabus
): (Upgrader & { priorityScore: number })[] {
  const scoredUpgraders = upgraders.map((u) => {
    let priorityScore = 0;
    if (u.pacingAgainstDeadlineDays && u.pacingAgainstDeadlineDays < 0) {
      priorityScore += Math.abs(u.pacingAgainstDeadlineDays);
    }
    const remaining = getRemainingRequirements(u, syllabus);
    if (
      remaining.length > 0 &&
      remaining.every((req) => !arePrerequisitesMet(req, u))
    ) {
      priorityScore += 1000;
    }
    return { ...u, priorityScore };
  });

  return scoredUpgraders.sort((a, b) => b.priorityScore - a.priorityScore);
}

export function calculateItemsToMeetMilestones(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  const remaining = getRemainingRequirements(upgrader, syllabus);
  const remainingEvents = remaining.filter(
    (r) => r.type === RequirementType.Event && !r.isDefaultWaived
  ).length;
  const remainingPqs = remaining.filter(
    (r) => r.type === RequirementType.PQS && !r.isDefaultWaived
  ).length;

  // Calculate items needed based on progress against deadline
  upgrader.eventsToMeetDeadline = remainingEvents;
  upgrader.pqsToMeetDeadline = remainingPqs;

  // Dummy calculation for ideal targets - can be refined
  // For example, only count items up to the 'target' level from appConfig
  upgrader.eventsToMeetIdeal = Math.max(0, remainingEvents - 5);
  upgrader.pqsToMeetIdeal = Math.max(0, remainingPqs - 10);

  // Calculate Cost Factor
  const pacing = upgrader.pacingAgainstDeadlineDays ?? 0;
  const remainingTotal = remaining.length;
  // Formula: Negative pacing is bad, high remaining item count is bad.
  // Normalize to a 0-100 score. This is a sample heuristic.
  const pacingCost = pacing < 0 ? Math.min(50, Math.abs(pacing)) : 0; // max 50 points from being behind
  const workCost = Math.min(50, remainingTotal / 2); // max 50 points from volume of work
  upgrader.costFactor = Math.round(pacingCost + workCost);
}

/**
 * Runs the complete sequence of calculations for an upgrader's progress.
 * This function mutates the upgrader object directly.
 * @param upgrader The upgrader to calculate.
 * @param syllabus The syllabus they are assigned to.
 * @param appConfig The current application configuration.
 */
export function runFullUpgraderCalculation(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  // Step 1: Resolve raw completions into the structured `allCompletions` array.
  upgrader.allCompletions = _resolveCompletionsFromRawData(upgrader, syllabus);

  // Step 2: Calculate the derived working levels for the upgrader.
  calculateDerivedWorkingLevels(upgrader, syllabus, appConfig);

  // Step 3: Calculate the progress percentages.
  calculateProgressMetrics(upgrader, syllabus, appConfig);

  // Step 4: Calculate the projected completion date.
  calculateProjections(upgrader, syllabus, appConfig);

  // Step 5: Now that we have a projection, we can calculate pacing.
  calculatePacing(upgrader, syllabus, appConfig);

  // Step 6: Now that we have pacing, we can determine readiness.
  calculateReadiness(upgrader, syllabus);

  // Step 7: Calculate 'what's next' metrics.
  calculateItemsToMeetMilestones(upgrader, syllabus, appConfig);
}

// src/core/trainingLogicService.ts

import type { Requirement, Syllabus, CompletionStatus } from '@/types/syllabiTypes';
import type { CompletionRecord } from '@/types/progressTypes';
import type { Personnel } from '@/types/personnelTypes';
import { syllabusLogicService } from '@/core/syllabusLogicService';

// =========================================================================
// NOTE FOR DEV TEAM:
// The primary change here is the removal of all `import { useProgressStore } ...`
// statements. All functions that need access to completion data now receive
// it as a function argument (`completionRecords: CompletionRecord[]`).
// This makes the service stateless and testable.
// =========================================================================


/**
 * Determines the completion status of a single requirement for a given person
 * based on the provided completion records.
 *
 * @param {Requirement} requirement - The requirement to check.
 * @param {Personnel} personnel - The person to check for.
 * @param {CompletionRecord[]} completionRecords - The pool of completion records to search within.
 * @returns {CompletionStatus} The calculated status of the requirement.
 */
const getCompletionStatusForRequirement = (
  requirement: Requirement,
  personnel: Personnel,
  completionRecords: CompletionRecord[]
): CompletionStatus => {
  const matchingCompletions = completionRecords.filter(
    record => record.name === requirement.name && record.student === personnel.name
  );

  if (matchingCompletions.length > 0) {
    // Logic to determine if it's complete, partial, etc.
    return 'Complete';
  }

  // More sophisticated logic can be added here for prerequisites, etc.
  
  return 'Not Started';
};

/**
 * Calculates the overall progress of a person for a given syllabus.
 *
 * @param {Personnel} personnel - The person to calculate progress for.
 * @param {Syllabus} syllabus - The syllabus to calculate progress against.
 * @param {CompletionRecord[]} completionRecords - The relevant set of completion records.
 * @returns {{ complete: number; total: number; percentage: number }} An object with progress stats.
 */
const getSyllabusProgressForPersonnel = (
  personnel: Personnel,
  syllabus: Syllabus,
  completionRecords: CompletionRecord[]
) => {
  const requirements = syllabus.requirements;
  let completedCount = 0;

  requirements.forEach(req => {
    const status = getCompletionStatusForRequirement(req, personnel, completionRecords);
    if (status === 'Complete') {
      completedCount++;
    }
  });

  const total = requirements.length;
  return {
    complete: completedCount,
    total: total,
    percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
  };
};


export const trainingLogicService = {
  getCompletionStatusForRequirement,
  getSyllabusProgressForPersonnel,
  // ... other logic functions would be included here
};
