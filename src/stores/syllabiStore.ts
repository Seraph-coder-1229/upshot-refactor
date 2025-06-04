import { defineStore } from 'pinia';
import { type Syllabus } from '../types/syllabiTypes';



export const useSyllabiStore = defineStore('syllabi', {
  state: () => ({ syllabi: [] as Syllabus[], isLoading: false }),
  actions: { /* ... */ }
});
