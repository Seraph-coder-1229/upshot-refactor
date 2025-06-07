import { type Upgrader } from "../types/personnelTypes";
import { type Syllabus, RequirementType } from "../types/syllabiTypes";

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
    // Corrected to use r.type
    const pqsForLevel = syllabus.requirements.filter(
      (r) => r.level === level && r.type === RequirementType.PQS
    );
    const allPqsComplete =
      pqsForLevel.length > 0 &&
      pqsForLevel.every((req) =>
        completedEventNames.has(req.name.toUpperCase())
      );
    if (allPqsComplete) {
      highestPqsLevelCompleted = level;
    }

    // Corrected to use r.type
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

  // Corrected to use syllabus.baseLevel
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
  const pqsForLevel = syllabus.requirements.filter(
    (r) => r.level === pqsWorkingLevel && r.type === RequirementType.PQS // Corrected to use r.type
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
    (r) => r.level === eventsWorkingLevel && r.type === RequirementType.Event // Corrected to use r.type
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
