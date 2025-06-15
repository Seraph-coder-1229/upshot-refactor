// src/types/appConfigTypes.ts
export interface ColorThemeValue {
  DEFAULT: string;
  hover: string;
  foreground: string;
}

// A simplified version for colors that don't need a hover state
export interface StatusColorThemeValue {
  DEFAULT: string;
  foreground: string;
}

export interface ColorScheme {
  primary: ColorThemeValue;
  secondary: ColorThemeValue;
  accent: ColorThemeValue;
  info: StatusColorThemeValue;
  warning: StatusColorThemeValue;
  action: StatusColorThemeValue;
  caution: StatusColorThemeValue;
}
export interface CurveDeadlineSetting {
  targetMonths: number;
  deadlineMonths: number;
}

export interface PositionLevelDeadlines {
  [level: string]: CurveDeadlineSetting; // e.g., 200: { target: 6, deadline: 12 }
}
export interface PositionSetting {
  useDerivedLevels: boolean;
  deadlines: PositionLevelDeadlines;
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
  positionSettings: {
    [positionKey: string]: PositionSetting;
  };
  useRoundedTrainingStartDate: boolean;
  geminiApiKey?: string;

  trainingDepartment: TrainingDepartmentPersonnelSetting;
  colorScheme: ColorScheme;
}

// ==> This is the crucial part for making it known globally <==
declare global {
  interface Window {
    UPSHOT_USER_APP_CONFIG?: AppConfig; // Use the AppConfig interface defined above
  }
}
