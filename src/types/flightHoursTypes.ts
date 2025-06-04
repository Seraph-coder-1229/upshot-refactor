import { type Identifiable } from "./commonTypes"; // Assuming Upgrader.id is string

/**
 * Represents the raw data for a pilot's flight hours as read from the proficiency file.
 * This structure will need to be confirmed/adjusted based on the actual Excel file format.
 */
export interface RawFlightHourEntry {
  pilotId: string; // Should match an Upgrader.id (e.g., SHARP Name)
  pilotDisplayName?: string; // Optional, can be pulled from personnelStore

  careerFlightTime: number;
  monthsInUnit: number;

  // If the source file provides month-by-month breakdowns:
  month1FlightTime?: number;
  month2FlightTime?: number;
  // ... potentially more, or a more flexible structure if a variable number of past months are included.

  // This was in your original HTML's data processing for flight hours.
  // It likely refers to an ACTC level or qualification status relevant to flight hour goals.
  actcStatus?: number | string; // e.g., 1, 2, 3 or "L200", "L300" etc.
}

/**
 * Represents calculated flight hour metrics for a pilot.
 */
export interface CalculatedFlightMetrics {
  pilotId: string;

  // Current state
  currentCareerHours: number;
  currentMonthsInUnit: number;

  // Goals (these might come from AppConfig or be specific to the Flight Hours module)
  wingTargetHoursAtGoalMonth: number; // e.g., 700 hours
  wingGoalMonthDuration: number; // e.g., 24 months
  squadronTargetHoursAtGoalMonth: number; // e.g., 700 hours
  squadronGoalMonthDuration: number; // e.g., 18 months

  // Calculated metrics
  hoursRequiredPerMonthForWing: number;
  hoursRequiredPerMonthForSquadron: number;
  hoursAheadOrBehindWing: number; // Positive if ahead, negative if behind
  hoursAheadOrBehindSquadron: number;
  projectedHoursAtWingGoalMonth: number | string; // string for "Past" or "Not enough data"
  projectedHoursAtSquadronGoalMonth: number | string;

  // Data for plotting historical progress (if available from source)
  // x: monthInUnit, y: cumulativeHours
  historicalHoursData?: Array<{ x: number; y: number }>;
}

/**
 * Represents the overall state for the flight hours module,
 * possibly managed by flightHoursStore.
 */
export interface FlightHoursState {
  pilotsMetrics: CalculatedFlightMetrics[];
  wingOverallGoal: { targetHours: number; durationMonths: number };
  squadronOverallGoal: { targetHours: number; durationMonths: number };
  isLoading: boolean;
  lastFileProcessed?: string;
}
