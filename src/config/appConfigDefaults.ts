import { type AppConfig } from "../types/appConfigTypes";

export const defaultConfig: AppConfig = {
  version: 1,
  curveDeadlines: {
    PILOT: { targetMonths: 12, deadlineMonths: 18 },
    NFO: { targetMonths: 6, deadlineMonths: 9 },
    AAW: { targetMonths: 12, deadlineMonths: 18 },
    EWO: { targetMonths: 12, deadlineMonths: 18 },
    DEFAULT: { targetMonths: 12, deadlineMonths: 18 },
  },
  useRoundedTrainingStartDate: true,
  trainingDepartment: {
    squadron: "Your Squadron Name/Number",
    departmentHead: "Department Head Name/Placeholder",
    pilotLead: "Pilot Lead Name/Placeholder",
    nfoLead: "NFO Lead Name/Placeholder",
    aawLead: "AAW Lead Name/Placeholder",
    ewoLead: "EWO Lead Name/Placeholder",
  },
};
