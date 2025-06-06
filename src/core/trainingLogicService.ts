import { type Upgrader } from "../types/personnelTypes";
import { type Syllabus, RequirementType } from "../types/syllabiTypes";

/**
 * Calculates the derived PQS and Events working levels for an upgrader
 * based on their completed items against a given syllabus.
 * @param upgrader The upgrader to calculate levels for.
 * @param syllabus The specific syllabus this upgrader is assigned to.
 */
export function calculateDerivedWorkingLevels(
  upgrader: Upgrader,
  syllabus: Syllabus
): void {
  // Get a simple set of completed event names for quick lookups
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  const levelsToCheck = [200, 300, 400]; // Or derive this from the syllabus
  let highestPqsLevelCompleted = 0;
  let highestEventsLevelCompleted = 0;

  for (const level of levelsToCheck) {
    // Check PQS completion for the current level
    const pqsForLevel = syllabus.requirements.filter(
      (r) => r.level === level && r.requirementType === RequirementType.PQS
    );
    const allPqsComplete =
      pqsForLevel.length > 0 &&
      pqsForLevel.every((req) =>
        completedEventNames.has(req.name.toUpperCase())
      );
    if (allPqsComplete) {
      highestPqsLevelCompleted = level;
    }

    // Check Events completion for the current level
    const eventsForLevel = syllabus.requirements.filter(
      (r) => r.level === level && r.requirementType === RequirementType.Event
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

  // Apply the "L(X) complete -> L(X+100) eligible" rule
  upgrader.derivedPqsWorkingLevel =
    highestPqsLevelCompleted > 0
      ? highestPqsLevelCompleted + 100
      : syllabus.level;
  upgrader.derivedEventsWorkingLevel =
    highestEventsLevelCompleted > 0
      ? highestEventsLevelCompleted + 100
      : syllabus.level;
}
