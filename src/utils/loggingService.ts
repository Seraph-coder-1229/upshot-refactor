// src/utils/loggingService.ts
import { saveAs } from "file-saver";
import { useAppConfigStore } from "../stores/appConfigStore"; // To get app config for export
// import { useUiStore } from '../stores/uiStore'; // Potentially to get loaded file names later
import { APP_VERSION, MAX_LOG_ENTRIES } from "../config/constants";
// Define a simple structure for log entries
interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  details?: any;
}

let logEntries: LogEntry[] = [];
let isInitialized = false;

// Helper to format details, especially Error objects
function formatDetails(details: any): string {
  if (details instanceof Error) {
    return `Error: ${details.name} - ${details.message}\nStack: ${details.stack}`;
  }
  if (typeof details === "object") {
    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return "Could not stringify details object.";
    }
  }
  return String(details);
}

export const loggingService = {
  init: (): void => {
    if (isInitialized) return;
    logEntries = [];
    // Avoid logging directly here if init is called before console is fully ready or if it causes circular issues.
    // A simple console.log is fine, or push to logEntries after it's cleared.
    console.log(
      `[LOGGING] Service Initialized. Max entries: ${MAX_LOG_ENTRIES}. App Version: ${APP_VERSION}`
    );
    // loggingService.logInfo('Logging service initialized.'); // This would call addEntry
    isInitialized = true;
  },

  addEntry: (
    level: "INFO" | "WARN" | "ERROR" | "DEBUG",
    message: string,
    details?: any
  ): void => {
    if (!isInitialized) {
      // Basic guard
      console.warn(
        "Logging service not initialized, buffering message:",
        message
      );
      // Optionally buffer a few messages if init is delayed.
      return;
    }
    if (logEntries.length >= MAX_LOG_ENTRIES) {
      logEntries.shift(); // Remove the oldest entry
    }
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details !== undefined ? formatDetails(details) : undefined,
    };
    logEntries.push(entry);

    // Also output to console for active development debugging
    switch (level) {
      case "INFO":
        console.info(`[${entry.timestamp}] INFO: ${message}`, details || "");
        break;
      case "WARN":
        console.warn(`[${entry.timestamp}] WARN: ${message}`, details || "");
        break;
      case "ERROR":
        console.error(`[${entry.timestamp}] ERROR: ${message}`, details || "");
        break;
      case "DEBUG":
        console.debug(`[${entry.timestamp}] DEBUG: ${message}`, details || "");
        break;
    }
  },

  logInfo: (message: string, details?: any): void => {
    loggingService.addEntry("INFO", message, details);
  },

  logWarn: (message: string, details?: any): void => {
    loggingService.addEntry("WARN", message, details);
  },

  logError: (message: string, errorOrDetails?: any): void => {
    loggingService.addEntry("ERROR", message, errorOrDetails);
  },

  logDebug: (message: string, details?: any): void => {
    // Debug logs might be conditional based on an environment variable or app setting
    // For now, let's assume they always log if called.
    loggingService.addEntry("DEBUG", message, details);
  },

  exportLogs: (): void => {
    if (!isInitialized) {
      alert("Logging service not ready for export.");
      return;
    }
    loggingService.logInfo("Log export initiated by user.");

    const appConfigStore = useAppConfigStore(); // Get current config
    // const uiStore = useUiStore(); // Placeholder for future data like loaded files

    let reportContent = `UPSHOT Application Debug Report\n`;
    reportContent += `================================\n`;
    reportContent += `Report Generated: ${new Date().toISOString()}\n`;
    reportContent += `Application Version: ${APP_VERSION}\n`;
    reportContent += `User Agent: ${navigator.userAgent}\n\n`;

    reportContent += `--- Application Configuration (Current Session) ---\n`;
    try {
      // Be careful about PII in config if this report might be shared broadly.
      // For a debug report TO DEVS, more detail is better.
      reportContent +=
        JSON.stringify(appConfigStore.currentConfig, null, 2) + "\n\n";
    } catch (e) {
      reportContent += "Error stringifying application configuration.\n\n";
    }

    // Placeholder for other dynamic state - to be implemented when stores are ready
    reportContent += `--- Loaded Data Files (Placeholder) ---\n`;
    // Example: if (uiStore.loadedFileNames) { reportContent += uiStore.loadedFileNames.join('\n') + '\n\n'; }
    reportContent += "File loading status will be added here.\n\n";

    reportContent += `--- Active Positions/Tracks (Placeholder) ---\n`;
    reportContent +=
      "Information on active tracks/positions will be added here.\n\n";

    reportContent += `--- Chronological Logs (${logEntries.length} entries) ---\n`;
    logEntries.forEach((entry) => {
      reportContent += `[${entry.timestamp}] [${entry.level}] ${entry.message}\n`;
      if (entry.details) {
        reportContent += `  Details: ${entry.details}\n`;
      }
    });

    try {
      const blob = new Blob([reportContent], {
        type: "text/plain;charset=utf-8",
      });
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\..+/, "");
      saveAs(blob, `UPSHOT_Debug_Report_${timestamp}.txt`);
    } catch (e) {
      loggingService.logError("Error saving log file:", e);
      alert(
        "Could not download log file. Please try copying from the console or contact support."
      );
    }
  },
};

// Initialize logging service when module is loaded,
// but ensure it's safe (e.g., doesn't rely on Pinia stores being ready if init does too much)
// A safer place for full init might be after Pinia is up in main.ts,
// but basic console logging can be enabled earlier.
// For now, init() is called from main.ts.
