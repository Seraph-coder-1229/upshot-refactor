// src/types/appConfigTypes.ts

export interface CurveDeadlineSetting {
  targetMonths: number;
  deadlineMonths: number;
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
    [syllabusTrackKey: string]: CurveDeadlineSetting;
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
