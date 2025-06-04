import {
  type AppConfig,
  type TrainingDepartmentPersonnelSetting,
  type PositionLevelDeadlines,
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
  200: { targetMonths: 6, deadlineMonths: 12 },
  300: { targetMonths: 10, deadlineMonths: 18 },
  400: { targetMonths: 12, deadlineMonths: 24 }, // Example
};

const nfoDeadlines: PositionLevelDeadlines = {
  200: { targetMonths: 5, deadlineMonths: 10 },
  300: { targetMonths: 9, deadlineMonths: 16 },
  400: { targetMonths: 11, deadlineMonths: 22 }, // Example
};

const aawDeadlines: PositionLevelDeadlines = {
  // Assuming AAW is a distinct position track
  200: { targetMonths: 7, deadlineMonths: 14 },
  300: { targetMonths: 11, deadlineMonths: 20 },
  // Add 400 if applicable
};

const ewoDeadlines: PositionLevelDeadlines = {
  // Assuming EWO is a distinct position track
  200: { targetMonths: 6, deadlineMonths: 13 },
  300: { targetMonths: 10, deadlineMonths: 19 },
  // Add 400 if applicable
};

export const defaultConfig: AppConfig = {
  version: 1,
  curveDeadlines: {
    PILOT: pilotDeadlines,
    NFO: nfoDeadlines,
    AAW: aawDeadlines,
    EWO: ewoDeadlines,
    // Add other positions as needed
  },
  useRoundedTrainingStartDate: true,
  trainingDepartment: defaultTrainingDepartment,
};
