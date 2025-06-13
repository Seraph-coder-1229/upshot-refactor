// src/core/trainingLogicService.ts

import { type Upgrader, ReadinessStatus } from "../types/personnelTypes";
import {
  type Syllabus,
  type Requirement,
  RequirementType,
  type PrioritizedRequirement,
} from "../types/syllabiTypes";
import { type AppConfig } from "../types/appConfigTypes";
import { addDays, daysBetween, getTodayUtc } from "../utils/dateUtils";
import {
  arePrerequisitesMet,
  isRequirementWaived,
} from "./syllabusLogicService";

export function getRemainingRequirements(
  upgrader: Upgrader,
  syllabus: Syllabus
): Requirement[] {
  if (!upgrader || !syllabus?.requirements) return [];
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );
  return syllabus.requirements.filter((req) => {
    const waived = isRequirementWaived(req, upgrader);
    const completed = completedEventNames.has(req.name.toUpperCase());
    return !waived && !completed;
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
  syllabus: Syllabus
): void {
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );
  const workingLevel =
    upgrader.derivedPqsWorkingLevel?.trim() ||
    String(syllabus.baseLevel).trim();

  const requirementsForLevel = syllabus.requirements.filter(
    (r) =>
      String(r.level).trim() === workingLevel &&
      !isRequirementWaived(r, upgrader)
  );

  const pqsForLevel = requirementsForLevel.filter(
    (r) => r.type === RequirementType.PQS
  );
  if (pqsForLevel.length > 0) {
    const completedPqsDifficulty = pqsForLevel
      .filter((r) => completedEventNames.has(r.name.toUpperCase()))
      .reduce((sum, r) => sum + (r.difficulty || 1), 0);
    const totalPqsDifficulty = pqsForLevel.reduce(
      (sum, r) => sum + (r.difficulty || 1),
      0
    );
    upgrader.pqsProgressPercentage =
      totalPqsDifficulty > 0
        ? (completedPqsDifficulty / totalPqsDifficulty) * 100
        : 100;
  } else {
    upgrader.pqsProgressPercentage = 100;
  }

  const eventsForLevel = requirementsForLevel.filter(
    (r) => r.type === RequirementType.Event
  );
  if (eventsForLevel.length > 0) {
    const completedEventsDifficulty = eventsForLevel
      .filter((r) => completedEventNames.has(r.name.toUpperCase()))
      .reduce((sum, r) => sum + (r.difficulty || 1), 0);
    const totalEventsDifficulty = eventsForLevel.reduce(
      (sum, r) => sum + (r.difficulty || 1),
      0
    );
    upgrader.eventsProgressPercentage =
      totalEventsDifficulty > 0
        ? (completedEventsDifficulty / totalEventsDifficulty) * 100
        : 100;
  } else {
    upgrader.eventsProgressPercentage = 100;
  }
}

function _calculateTargetPacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): number {
  const deltas: number[] = [];
  const positionSettings =
    appConfig.positionSettings[upgrader.assignedPosition];
  if (!positionSettings) return 0;

  for (const completion of upgrader.rawCompletions) {
    const requirement = syllabus.requirements.find(
      (r) => r.name.toUpperCase() === completion.event.toUpperCase()
    );
    if (!requirement) continue;

    const targetMonths =
      positionSettings.deadlines[requirement.level]?.targetMonths;
    if (targetMonths == null) continue;

    const targetDate = addDays(upgrader.startDate, targetMonths * 30.44);
    const delta = daysBetween(completion.date, targetDate);
    deltas.push(delta);
  }

  if (deltas.length === 0) return 0;
  return Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length);
}

function _calculateDeadlinePacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): number {
  const positionKey = upgrader.assignedPosition;
  const level = upgrader.derivedPqsWorkingLevel || syllabus.baseLevel;
  const deadlineMonths =
    appConfig.positionSettings[positionKey]?.deadlines[level]?.deadlineMonths ||
    0;
  if (deadlineMonths === 0) return 0;

  let finalDeadline = addDays(upgrader.startDate, deadlineMonths * 30.44);
  if (upgrader.onWaiver) finalDeadline = addDays(finalDeadline, 90);

  const totalTimeInDays = daysBetween(upgrader.startDate, finalDeadline);
  const elapsedTimeInDays = daysBetween(upgrader.startDate, getTodayUtc());
  if (totalTimeInDays <= 0 || elapsedTimeInDays < 0) return 0;

  const expectedProgressPercent = Math.min(
    elapsedTimeInDays / totalTimeInDays,
    1
  );
  const totalRequirements = syllabus.requirements.filter(
    (r) => !isRequirementWaived(r, upgrader)
  ).length;
  const expectedCompletions = totalRequirements * expectedProgressPercent;
  const actualCompletions = upgrader.rawCompletions.length;
  const completionDelta = actualCompletions - expectedCompletions;
  const completionRatePerDay =
    totalTimeInDays > 0 ? totalRequirements / totalTimeInDays : 0;

  return completionRatePerDay > 0
    ? Math.round(completionDelta / completionRatePerDay)
    : 0;
}

export function calculatePacing(
  upgrader: Upgrader,
  syllabus: Syllabus,
  appConfig: AppConfig
): void {
  upgrader.pacingAgainstTargetDays = upgrader.onWaiver
    ? undefined
    : _calculateTargetPacing(upgrader, syllabus, appConfig);
  upgrader.pacingAgainstDeadlineDays = _calculateDeadlinePacing(
    upgrader,
    syllabus,
    appConfig
  );
}

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
