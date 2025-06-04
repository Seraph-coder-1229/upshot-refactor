import { type AppConfig } from "../types/appConfigTypes";

export const defaultConfig: AppConfig = {
  version: 1,
  curveDeadlines: {
    defaultPqs: { targetMonths: 12, deadlineMonths: 18 },
    defaultEvents: { targetMonths: 6, deadlineMonths: 9 },
  },
  isRoundStartDateFixed: false,
  fixedRoundStartDate: null,
};
