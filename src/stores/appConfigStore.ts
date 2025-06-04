// src/stores/appConfigStore.ts
// Basic stub - will be fully implemented in Phase 2
import { defineStore } from 'pinia';
import { type AppConfig } from '../types/appConfigTypes'; // Assuming appConfigTypes.ts exists
import { defaultConfig } from '../config/appConfigDefaults'; // Assuming appConfigDefaults.ts exists
import { loggingService }    from '../utils/loggingService';


// Ensure 'Window' interface is augmented if not done in loggingService or another central place
// declare global {
//   interface Window {
//     UPSHOT_USER_APP_CONFIG?: AppConfig;
//   }
// }

function getInitialConfig(): AppConfig {
  if (typeof window.UPSHOT_USER_APP_CONFIG === 'object' && window.UPSHOT_USER_APP_CONFIG !== null) {
    loggingService.logInfo('[AppConfig-STUB] User config found on window.');
    // Add more robust merging/validation later
    return { ...defaultConfig, ...window.UPSHOT_USER_APP_CONFIG };
  }
  loggingService.logInfo('[AppConfig-STUB] Using default app config.');
  return JSON.parse(JSON.stringify(defaultConfig));
}

export const useAppConfigStore = defineStore('appConfig', {
  state: () => {
    const initial = getInitialConfig();
    return {
      currentConfig: initial,
      isDirty: false,
      lastLoadedConfigSnapshot: JSON.stringify(initial),
    };
  },
  actions: {
    // Basic stubs, to be fleshed out
    updateConfigValue(keyPath: string, value: any) {
      console.log(`[AppConfig-STUB] Update ${keyPath} to ${value}`);
      this.isDirty = true;
    },
    downloadCurrentConfig() {
      console.log('[AppConfig-STUB] Downloading config...');
      alert('[STUB] Config download will be implemented later.');
      this.isDirty = false;
    },
     markAsSaved() { this.isDirty = false; this.lastLoadedConfigSnapshot = JSON.stringify(this.currentConfig);},
     resetToDefaults() {this.currentConfig = JSON.parse(JSON.stringify(defaultConfig)); this.isDirty = true;},

  },
});