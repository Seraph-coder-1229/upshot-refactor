import {
  type AppConfig,
  type TrainingDepartmentPersonnelSetting,
  type PositionLevelDeadlines,
  PositionSetting,
} from "../types/appConfigTypes";

// Default Training Department Personnel
const defaultTrainingDepartment: TrainingDepartmentPersonnelSetting = {
  squadron: "YOUR SQUADRON",
  departmentHead: "Dept Head Name",
  pilotLead: "Pilot Lead Name",
  nfoLead: "NFO Lead Name",
  aawLead: "AAW Lead Name",
  ewoLead: "EWO Lead Name",
};

// Define default deadlines for each position and level
const pilotDeadlines: PositionLevelDeadlines = {
  "200": { targetMonths: 6, deadlineMonths: 12 },
  "300": { targetMonths: 10, deadlineMonths: 18 },
  "400": { targetMonths: 12, deadlineMonths: 24 }, // Example
};

const nfoDeadlines: PositionLevelDeadlines = {
  "200": { targetMonths: 5, deadlineMonths: 10 },
  "300": { targetMonths: 9, deadlineMonths: 16 },
  "400": { targetMonths: 11, deadlineMonths: 22 }, // Example
};

const aawDeadlines: PositionLevelDeadlines = {
  // Assuming AAW is a distinct position track
  "200": { targetMonths: 7, deadlineMonths: 14 },
  "300": { targetMonths: 8, deadlineMonths: 18 },
  // Add "400" if applicable
};

const ewoDeadlines: PositionLevelDeadlines = {
  // Assuming EWO is a distinct position track
  "200": { targetMonths: 6, deadlineMonths: 13 },
  " 300": { targetMonths: 10, deadlineMonths: 19 },
  // Add 400 if applicable
};

const ewoSettings: PositionSetting = {
  useDerivedLevels: true,
  deadlines: ewoDeadlines,
};
const aawSettings: PositionSetting = {
  useDerivedLevels: true,
  deadlines: aawDeadlines,
};
const nfoSettings: PositionSetting = {
  useDerivedLevels: true,
  deadlines: nfoDeadlines,
};
const pilotSettings: PositionSetting = {
  useDerivedLevels: true,
  deadlines: pilotDeadlines,
};

export const defaultConfig: AppConfig = {
  version: 1,
  positionSettings: {
    PILOT: pilotSettings,
    NFO: nfoSettings,
    AAW: aawSettings,
    EWO: ewoSettings,
    // Add other positions as needed
  },
  useRoundedTrainingStartDate: true,
  trainingDepartment: defaultTrainingDepartment,
};
