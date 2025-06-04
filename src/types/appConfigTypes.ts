// src/types/appConfigTypes.ts

export interface CurveDeadlineSetting {
    targetMonths: number;
    deadlineMonths: number;
  }
  
  export interface AppConfig {
    version: number;
    curveDeadlines: {
      [syllabusTrackKey: string]: CurveDeadlineSetting;
    };
    isRoundStartDateFixed: boolean;
    fixedRoundStartDate: string | null; // YYYY-MM-DD format if fixed
    // ... other config properties ...
  }
  
  // ==> This is the crucial part for making it known globally <==
  declare global {
    interface Window {
      UPSHOT_USER_APP_CONFIG?: AppConfig; // Use the AppConfig interface defined above
    }
  }