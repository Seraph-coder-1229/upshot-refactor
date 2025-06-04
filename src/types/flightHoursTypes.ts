export interface FlightHourEntry {
  pilotId: string; // Link to Upgrader.id
  monthInUnit: number;
  careerFlightTime: number;
  // ... any other fields from the flight hours Excel
}

export interface FlightHoursCalculated {
  pilotId: string;
  hoursRequiredWing: number;
  hoursRequiredSquadron: number;
  hoursBehindWing: number;
  hoursBehindSquadron: number;
  projectedHoursWing: number;
  projectedHoursSquadron: number;
}
