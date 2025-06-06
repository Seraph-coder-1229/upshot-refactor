// src/types/appConfigTypes.ts

export interface CurveDeadlineSetting {
  targetMonths: number;
  deadlineMonths: number;
}

export interface PositionLevelDeadlines {
  [level: number]: CurveDeadlineSetting; // e.g., 200: { target: 6, deadline: 12 }
}

export interface TrainingDepartmentPersonnelSetting {
  squadron: string | null;
  departmentHead: string | null;
  pilotLead: string | null;
  nfoLead: string | null;
  aawLead: string | null;
  ewoLead: string | null;
}

export interface AppConfig {
  version: number;
  curveDeadlines: {
    // Key is the position string (e.g., "PILOT", "NFO", "EWO", "AAW")
    [positionKey: string]: PositionLevelDeadlines;
  };
  useRoundedTrainingStartDate: boolean;
  // ... other config properties ...

  trainingDepartment: TrainingDepartmentPersonnelSetting;
}

// ==> This is the crucial part for making it known globally <==
declare global {
  interface Window {
    UPSHOT_USER_APP_CONFIG?: AppConfig; // Use the AppConfig interface defined above
  }
}
