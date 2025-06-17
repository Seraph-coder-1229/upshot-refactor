import { type Upgrader } from "../types/personnelTypes";
import { type Requirement } from "../types/syllabiTypes";

/**
 * Checks if an upgrader has met all the prerequisite requirements for a given item.
 * @param requirement - The requirement to check prerequisites for.
 * @param upgrader - The upgrader whose completions will be checked.
 * @returns `true` if all prerequisites are met, otherwise `false`.
 */
export function arePrerequisitesMet(
  requirement: Requirement,
  upgrader: Upgrader
): boolean {
  // If there are no prerequisites defined, they are automatically met.
  if (!requirement.prerequisites || requirement.prerequisites.length === 0) {
    return true;
  }

  // Create a Set of completed event names for fast lookups.
  const completedEventNames = new Set(
    upgrader.rawCompletions.map((c) => c.event.toUpperCase())
  );

  // Check if every prerequisite name is present in the set of completed events.
  return requirement.prerequisites.every((prereqName) =>
    completedEventNames.has(prereqName.toUpperCase())
  );
}

/**
 * Determines if a specific requirement is considered waived for a given upgrader.
 * This checks for multiple waiver conditions.
 * @param requirement - The requirement to check.
 * @param upgrader - The upgrader.
 * @returns `true` if the requirement is waived, otherwise `false`.
 */
export function isRequirementWaived(
  requirement: Requirement,
  upgrader: Upgrader
): boolean {
  // Condition 1: Check for an explicit, individual waiver in the SHARP data.
  // This is the highest priority waiver.
  const completionRecord = upgrader.rawCompletions.find(
    (c) => c.event.toUpperCase() === requirement.name.toUpperCase()
  );
  if (completionRecord?.status?.toUpperCase().includes("WAIVED")) {
    return true;
  }

  if (requirement.isDefaultWaived) {
    return true;
  }

  return false;
}

/**
 * Checks if a requirement is satisfied, meaning it is either completed or waived.
 * @param requirement - The requirement to check.
 * @param upgrader - The upgrader.
 * @returns `true` if the requirement is satisfied, otherwise `false`.
 */
export function isRequirementSatisfied(
  requirement: Requirement,
  upgrader: Upgrader
): boolean {
  // A requirement is satisfied if it's waived...
  if (isRequirementWaived(requirement, upgrader)) {
    return true;
  }

  // ...or if it has been completed.
  const isCompleted = upgrader.rawCompletions.some(
    (c) => c.event.toUpperCase() === requirement.name.toUpperCase()
  );

  return isCompleted;
}
