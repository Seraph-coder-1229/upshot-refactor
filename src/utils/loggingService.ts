import { saveAs } from "file-saver";
import { useAppConfigStore } from "../stores/appConfigStore";
import { APP_VERSION, MAX_LOG_ENTRIES } from "../config/constants";

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  details?: any;
}

let logEntries: LogEntry[] = [];
let isInitialized = false;

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
    console.log(
      `[LOGGING] Service Initialized. Max entries: ${MAX_LOG_ENTRIES}. App Version: ${APP_VERSION}`
    );
    isInitialized = true;
  },

  addEntry: (
    level: "INFO" | "WARN" | "ERROR" | "DEBUG",
    message: string,
    details?: any
  ): void => {
    if (logEntries.length >= MAX_LOG_ENTRIES) {
      logEntries.shift();
    }
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details: details !== undefined ? formatDetails(details) : undefined,
    };
    logEntries.push(entry);

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

  // NEW: Function to get a copy of the current logs for display
  getLogs: (): LogEntry[] => {
    return [...logEntries]; // Return a copy to prevent direct mutation
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
    loggingService.addEntry("DEBUG", message, details);
  },

  exportLogs: (): void => {
    loggingService.logInfo("Log export initiated by user.");
    let reportContent = `UPSHOT Application Debug Report\n`;
    reportContent += `================================\n`;
    // ... (rest of the export logic is the same)
    logEntries.forEach((entry) => {
      reportContent += `[${entry.timestamp}] [${entry.level}] ${entry.message}\n`;
      if (entry.details) {
        reportContent += `  Details: ${entry.details}\n`;
      }
    });

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");
    saveAs(blob, `UPSHOT_Debug_Report_${timestamp}.txt`);
  },
};
