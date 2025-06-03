export interface Requirement { id: string; name: string; displayName: string; prerequisites: string[]; difficulty?: number; isDefaultWaived?: boolean; }
export interface Syllabus { id: string; title: string; position: string; level: number; year: string; type: 'pqs' | 'events'; requirements: Requirement[]; wingGoalMonths: number; squadronGoalMonths: number; /* ... */ }
