/**
 * @file This Pinia store manages the application's global configuration.
 * It is responsible for loading settings and providing access to them for other services.
 */

import { defineStore } from "pinia";
import {
  type AppConfig,
  type CurveDeadlineSetting,
} from "../types/appConfigTypes";
import { defaultConfig } from "../config/appConfigDefaults";
import { loggingService } from "../utils/loggingService";
import { saveAs } from "file-saver";
import { deepClone } from "@/utils/dataUtils";
import { useUiStore } from "./uiStore";

function getInitialConfiguration(): AppConfig {
  let effectiveConfig = deepClone(defaultConfig);

  const userConfig = window.UPSHOT_USER_APP_CONFIG;
  if (userConfig && typeof userConfig === "object") {
    loggingService.logInfo(
      "User application configuration found. Merging with defaults."
    );
    // A simple merge. A more robust solution might handle deep merging.
    effectiveConfig = { ...effectiveConfig, ...userConfig };
  } else {
    loggingService.logInfo(
      "No user configuration found. Using default application settings."
    );
  }
  return effectiveConfig;
}

export const useAppConfigStore = defineStore("appConfig", {
  state: () => ({
    config: getInitialConfiguration(),
    isDirty: false,
  }),

  getters: {
    /**
     * Returns the entire current configuration object.
     */
    currentConfig: (state): AppConfig => state.config,

    /**
     * CRITICAL GETTER RESTORED:
     * Retrieves the specific deadline settings for a given position and level.
     * This is used by logic services and chart components.
     * @returns A CurveDeadlineSetting object or null if not found.
     */
    getDeadlinesForPositionLevel:
      (state) =>
      (position: string, level: string): CurveDeadlineSetting | null => {
        return (
          state.config.positionSettings[position]?.deadlines[level] || null
        );
      },

    /**
     * Returns a list of all positions that have settings defined in the config.
     */
    getPositionsWithSettings: (state): string[] => {
      return Object.keys(state.config.positionSettings);
    },
  },

  actions: {
    /**
     * Updates a specific part of the configuration and marks it as dirty.
     */
    updateConfig(partialConfig: Partial<AppConfig>) {
      this.config = { ...this.config, ...partialConfig };
      this.isDirty = true;
      loggingService.logInfo("Application configuration updated by user.");
    },

    /**
     * Resets the entire configuration back to the application's defaults.
     */
    resetToDefaults() {
      this.config = deepClone(defaultConfig);
      this.isDirty = true;
      loggingService.logInfo("Configuration has been reset to defaults.");
      useUiStore().addNotification({
        message:
          "Configuration reset to defaults. Download to save these changes.",
        type: "info",
      });
    },

    /**
     * Triggers a browser download of the current configuration as a 'user_config.js' file.
     */
    downloadCurrentConfig() {
      try {
        const configString = JSON.stringify(this.config, null, 2);
        const fileContent = `// UPSHOT User Configuration File\n// Place this file in a 'config' folder next to your index.html file.\nwindow.UPSHOT_USER_APP_CONFIG = ${configString};`;
        const blob = new Blob([fileContent], {
          type: "application/javascript;charset=utf-8",
        });

        saveAs(blob, "user_config.js");

        this.isDirty = false;
        loggingService.logInfo("Configuration downloaded successfully.");
      } catch (error) {
        loggingService.logError(
          "Error downloading application configuration:",
          error
        );
        useUiStore().addNotification({
          message: "Failed to download configuration file.",
          type: "error",
        });
      }
    },
  },
});
