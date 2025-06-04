// src/stores/appConfigStore.ts
import { defineStore } from "pinia";
import {
  type AppConfig,
  type CurveDeadlineSetting,
  type TrainingDepartmentPersonnelSetting,
  type PositionLevelDeadlines, // Assuming this is also exported from appConfigTypes if needed directly
} from "../types/appConfigTypes";
import { defaultConfig } from "../config/appConfigDefaults";
import { loggingService } from "../utils/loggingService";
import { saveAs } from "file-saver"; // For downloading the config
import { APP_VERSION } from "../config/constants";
import { deepClone } from "@/utils/dataUtils";

// Function to get the initial configuration
function getInitialConfiguration(): AppConfig {
  let effectiveConfig = deepClone(defaultConfig); // Start with a fresh copy of defaults

  if (
    typeof window.UPSHOT_USER_APP_CONFIG === "object" &&
    window.UPSHOT_USER_APP_CONFIG !== null
  ) {
    const userConfigFromFile = deepClone(window.UPSHOT_USER_APP_CONFIG); // Clone user config too
    loggingService.logInfo(
      "User application configuration found on window object."
    );

    if (typeof userConfigFromFile.version === "number") {
      if (userConfigFromFile.version < defaultConfig.version) {
        loggingService.logWarn(
          `User config version (${userConfigFromFile.version}) is older than app's expected version (${defaultConfig.version}). Merging with defaults; some new settings may use default values.`
        );
        // Merge user's older config onto a fresh default, then update version
        effectiveConfig = {
          ...deepClone(defaultConfig),
          ...userConfigFromFile,
        };
        effectiveConfig.version = defaultConfig.version; // Update to current app's config version
      } else if (userConfigFromFile.version > defaultConfig.version) {
        loggingService.logWarn(
          `User config version (${userConfigFromFile.version}) is NEWER than app's expected version (${defaultConfig.version}). This may cause issues. Using user config as is but logging discrepancy.`
        );
        effectiveConfig = userConfigFromFile; // Trust the newer config but be aware
      } else {
        // Versions match, merge to ensure all default keys are present if user's file is partial
        effectiveConfig = {
          ...deepClone(defaultConfig),
          ...userConfigFromFile,
        };
        loggingService.logInfo(
          "User application configuration loaded with matching version."
        );
      }
    } else {
      loggingService.logWarn(
        "User config from window is missing a version number or is malformed. Using default application configuration."
      );
      effectiveConfig = deepClone(defaultConfig); // Revert to default if user config is truly unusable
    }
  } else {
    loggingService.logInfo(
      "No user_config.js found on window. Using default application configuration."
    );
  }
  return effectiveConfig;
}

export const useAppConfigStore = defineStore("appConfig", {
  state: () => {
    const initialConfig = getInitialConfiguration();
    return {
      currentConfig: initialConfig,
      isDirty: false,
      lastLoadedConfigSnapshot: JSON.stringify(initialConfig),
    };
  },

  actions: {
    _updateAndCheckDirty() {
      const currentSnapshot = JSON.stringify(this.currentConfig);
      if (currentSnapshot !== this.lastLoadedConfigSnapshot) {
        this.isDirty = true;
        loggingService.logInfo(
          "AppConfig has been modified. Changes pending save."
        );
      } else {
        this.isDirty = false; // Should only happen if reverted to snapshot state
      }
    },

    /**
     * Updates a specific curve deadline setting for a position and level.
     */
    updateCurveDeadlineSetting(
      positionKey: string,
      level: number,
      setting: Partial<CurveDeadlineSetting>
    ) {
      const positionKeyUpper = positionKey.toUpperCase(); // Standardize key
      if (!this.currentConfig.curveDeadlines[positionKeyUpper]) {
        this.currentConfig.curveDeadlines[positionKeyUpper] =
          {} as PositionLevelDeadlines;
      }
      if (!this.currentConfig.curveDeadlines[positionKeyUpper][level]) {
        // Initialize with some defaults if level doesn't exist, or log warning
        this.currentConfig.curveDeadlines[positionKeyUpper][level] = {
          targetMonths: 0,
          deadlineMonths: 0,
        };
        loggingService.logWarn(
          `Initializing new curve deadline for ${positionKeyUpper} L${level}.`
        );
      }
      this.currentConfig.curveDeadlines[positionKeyUpper][level] = {
        ...this.currentConfig.curveDeadlines[positionKeyUpper][level],
        ...setting,
      };
      this._updateAndCheckDirty();
    },

    /**
     * Updates the 'useRoundedTrainingStartDate' setting.
     */
    updateUseRoundedTrainingStartDate(value: boolean) {
      this.currentConfig.useRoundedTrainingStartDate = value;
      this._updateAndCheckDirty();
    },

    /**
     * Updates a single property of the trainingDepartment setting.
     */
    updateTrainingDepartmentProperty<
      K extends keyof TrainingDepartmentPersonnelSetting
    >(key: K, value: TrainingDepartmentPersonnelSetting[K]) {
      console.log(this.currentConfig.trainingDepartment);
      if (
        this.currentConfig.trainingDepartment.hasOwnProperty.call(
          this.currentConfig.trainingDepartment,
          key
        )
      ) {
        this.currentConfig.trainingDepartment[key] = value;
        console.log(this.currentConfig);
        this._updateAndCheckDirty();
        loggingService.logDebug(`${key}: ${value}`);
      } else {
        loggingService.logWarn(
          `Attempted to update non-existent training department property: ${String(
            key
          )}`
        );
      }
    },

    /**
     * Updates multiple properties of the trainingDepartment setting.
     */
    updateTrainingDepartment(
      settings: Partial<TrainingDepartmentPersonnelSetting>
    ) {
      this.currentConfig.trainingDepartment = {
        ...this.currentConfig.trainingDepartment,
        ...settings,
      };
      this._updateAndCheckDirty();
    },

    /**
     * Replaces the entire configuration. Used internally for loading or major resets.
     * The main way users load config is via window object on startup.
     */
    _dangerouslySetFullConfig(newConfig: AppConfig) {
      // Consider version checking/migration here as well if used broadly
      this.currentConfig = deepClone(newConfig);
      this.lastLoadedConfigSnapshot = JSON.stringify(this.currentConfig);
      this.isDirty = false;
      loggingService.logInfo("Full configuration replaced.");
    },

    resetToDefaults() {
      this.currentConfig = deepClone(defaultConfig);
      // After resetting, the state *is* different from what might have been saved/loaded
      // so it should be considered dirty until explicitly saved by the user.
      this.isDirty = true;
      loggingService.logInfo(
        "Application configuration reset to defaults. Changes are now dirty."
      );
    },

    markAsSaved() {
      this.lastLoadedConfigSnapshot = JSON.stringify(this.currentConfig);
      this.isDirty = false;
      loggingService.logInfo(
        "Current application configuration has been marked as saved."
      );
    },

    downloadCurrentConfig() {
      loggingService.logInfo(
        "Download current application configuration initiated."
      );
      try {
        const configToSave = deepClone(this.currentConfig);
        // Ensure the version in the saved config matches the app's current default/expected version
        // if migrations happened or if it's a new config based on defaults.
        configToSave.version = defaultConfig.version;

        const configString = JSON.stringify(configToSave, null, 2);
        const fileContent = `// UPSHOT Application User Configuration
// Timestamp: ${new Date().toISOString()}
// App Version at Save: ${APP_VERSION} (This is app code version, config structure version is inside the object)
//
// To use this file:
// 1. Save it (or rename this downloaded file) as 'user_config.js'
// 2. Create a folder named 'config' in the same directory as your UPSHOT index.html file.
// 3. Place 'user_config.js' inside that 'config' folder (e.g., ./config/user_config.js).
// 4. Reload the UPSHOT application.
window.UPSHOT_USER_APP_CONFIG = ${configString};
`;
        const blob = new Blob([fileContent], {
          type: "application/javascript;charset=utf-8",
        });
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\..+/, "");
        const filename = `upshot_config_download_${timestamp}.js`;

        saveAs(blob, filename);
        this.markAsSaved(); // After successful download initiation, consider it "saved"
        loggingService.logInfo(
          `Configuration downloaded as ${filename}. User needs to place it correctly.`
        );
      } catch (error: any) {
        loggingService.logError(
          "Error preparing or downloading application configuration:",
          error
        );
        // Consider using uiStore to show an error notification
        // const uiStore = useUiStore();
        // uiStore.addNotification({ message: `Error downloading config: ${error.message}`, type: 'error' });
      }
    },
  },
});
