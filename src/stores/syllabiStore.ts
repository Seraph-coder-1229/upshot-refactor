import { defineStore } from 'pinia';
import { type Syllabus } from '../types/syllabiTypes';

declare global {
  interface Window {
    UPSHOT_USER_SYLLABI?: Syllabus[];
  }
}

export const useSyllabiStore = defineStore('syllabi', {
  state: () => ({ syllabi: [] as Syllabus[], isLoading: false }),
  actions: { /* ... */ }
});
