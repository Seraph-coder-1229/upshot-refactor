import { defineStore } from 'pinia';
import { type AppNotification } from '../types/commonTypes';

export const useUiStore = defineStore('ui', {
  state: () => ({ notifications: [] as AppNotification[], isLoading: false, criticalError: null as Error | null, criticalErrorMessage: '' }),
  actions: { /* ... */ }
});
