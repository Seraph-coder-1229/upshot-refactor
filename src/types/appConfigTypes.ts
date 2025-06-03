export interface CurveDeadlineSetting { targetMonths: number; deadlineMonths: number; }
export interface AppConfig { version: number; curveDeadlines: { [key: string]: CurveDeadlineSetting }; isRoundStartDateFixed: boolean; fixedRoundStartDate: string | null; /* ... */ }
