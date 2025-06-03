import { defineStore } from 'pinia';
import { type AppConfig } from '../types/appConfigTypes';
import { defaultConfig } from '../config/appConfigDefaults';
import { loggingService } from '../utils/loggingService';

declare global {
  interface Window {
    UPSHOT_USER_APP_CONFIG?: AppConfig;
  }
}

function getInitialConfig(): AppConfig { /* ... load from window or defaults ... */ return defaultConfig; }

export const useAppConfigStore = defineStore('appConfig', {
  state: () => ({ currentConfig: getInitialConfig(), isDirty: false, lastLoadedConfigSnapshot: '' }),
  actions: { /* ... */ }
});
