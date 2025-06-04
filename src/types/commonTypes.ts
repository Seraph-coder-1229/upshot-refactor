export interface Identifiable {
    id: string; // A unique identifier, can be number if preferred
  }
  
  export interface Named {
    name: string; // Often an internal or official name
    displayName: string; // User-friendly display name
  }
  
  export interface AppNotification {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number; // Optional: duration in ms for toast to show
  }