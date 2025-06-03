import { defineStore } from 'pinia';
import { type Upgrader } from '../types/personnelTypes';

export const usePersonnelStore = defineStore('personnel', {
  state: () => ({ allPersonnel: [] as Upgrader[] }),
  actions: { /* ... */ }
});
