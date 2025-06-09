import { createApp, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";

import App from "./App.vue";

// Import global styles (Tailwind CSS)
import "./assets/css/tailwind.css"; // Ensure this path is correct

// Import Logging Service and UI Store (and other stores if needed at init)
import { loggingService } from "./utils/loggingService";
import { useUiStore } from "./stores/uiStore";
import { useAppConfigStore } from "./stores/appConfigStore"; // To initialize/load config early if needed

// --- 1. Initialize Logging Service (as early as possible) ---
loggingService.init();
loggingService.logInfo("Application booting up...");

// --- 2. Create Vue Application Instance ---
const app = createApp(App);
app.use(router);
// --- 3. Create and Use Pinia for State Management ---
const pinia = createPinia();
app.use(pinia);

// Make stores available after Pinia is used by the app, especially if they are used by global handlers
// It's often cleaner if global error handlers call loggingService directly,
// and loggingService internally decides if it needs to interact with a store (though it should be careful about dependencies).
// For now, uiStore will be used directly in the error handlers.
const uiStore = useUiStore(); // Initialize after app.use(pinia)
const appConfigStore = useAppConfigStore(); // Initialize config store (it loads defaults/user file via its own state setup)

loggingService.logInfo(
  `App config version loaded: ${appConfigStore.currentConfig.version}`
);

// --- 4. Global Error Handling ---
// Vue specific errors
app.config.errorHandler = (err: unknown, instance: any, info: string) => {
  const error = err as Error;
  const componentName =
    instance?.$options?.name || instance?._?.type?.name || "UnknownComponent";

  loggingService.logError("Vue Error", {
    message: error.message,
    stack: error.stack,
    componentName,
    lifecycleHook: info,
  });

  uiStore.addNotification({
    message: `An error occurred in component ${componentName}: ${error.message}`,
    type: "error",
    duration: 10000, // Show longer for errors
  });

  // For truly critical errors that should halt the app and show the CriticalErrorDisplay
  // you might add more specific checks here or let higher-level catches do it.
  // Example: if (error.message.includes("Cannot render app")) {
  //   uiStore.setCriticalError(error, "A critical rendering error occurred.");
  // }
};

// General JavaScript errors (uncaught exceptions)
window.onerror = (message, source, lineno, colno, error) => {
  loggingService.logError("Global window.onerror:", {
    message,
    source,
    lineno,
    colno,
    error: error
      ? { name: error.name, message: error.message, stack: error.stack }
      : "N/A",
  });
  // Decide if this error is critical enough to halt the app
  // For most unhandled errors, showing a notification is good.
  // If you determine an error is critical, call uiStore.setCriticalError
  if (
    error &&
    (error.name === "ChunkLoadError" ||
      error.message.includes("Failed to fetch dynamically imported module"))
  ) {
    uiStore.setCriticalError(
      error,
      "Failed to load a critical part of the application. Please check your network or try refreshing. If the problem persists, the application files might be corrupted or incomplete."
    );
  } else {
    uiStore.addNotification({
      message: `An unexpected global error occurred: ${message}`,
      type: "error",
      duration: 10000,
    });
  }
  return true; // Prevents default browser error handling (e.g., printing to console)
};

// Unhandled promise rejections
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const reason = event.reason as
    | Error
    | string
    | { message?: string; stack?: string };
  let errorMessage = "An unknown promise rejection occurred.";
  let errorDetails: any = event.reason;

  if (reason instanceof Error) {
    errorMessage = reason.message;
    errorDetails = {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    };
  } else if (typeof reason === "string") {
    errorMessage = reason;
  } else if (reason && typeof (reason as any).message === "string") {
    errorMessage = (reason as any).message;
  }

  loggingService.logError("Global unhandledrejection:", errorDetails);

  // Decide if this is critical
  // For example, if (errorMessage.includes("database connection failed")) {
  //   uiStore.setCriticalError(event.reason as Error, `A critical promise rejection occurred: ${errorMessage}`);
  // } else {
  uiStore.addNotification({
    message: `Unhandled promise rejection: ${errorMessage}`,
    type: "error",
    duration: 10000,
  });
  // }
};

loggingService.logInfo("Global error handlers configured.");

// --- 5. Provide Global Properties (like $exportLogs) ---
// This makes it available in any component's `this` context (Options API)
// or via `getCurrentInstance` (Composition API).
app.config.globalProperties.$exportLogs = loggingService.exportLogs;
loggingService.logInfo("Global properties ($exportLogs) added.");

// --- 6. Mount the Application ---
try {
  app.mount("#app");
  loggingService.logInfo("Application mounted successfully.");
} catch (mountError: any) {
  const error = mountError as Error;
  loggingService.logError("CRITICAL: Application failed to mount!", {
    message: error.message,
    stack: error.stack,
  });
  uiStore.setCriticalError(
    error,
    "The application could not start due to a critical error during initialization. Please download the debug report and contact support."
  );
  // If app.mount fails, Vue might not be able to render anything, including CriticalErrorDisplay.
  // In such a scenario, you might need a very basic HTML fallback in index.html or direct DOM manipulation here.
  // For now, we rely on App.vue's template to show CriticalErrorDisplay if the uiStore state is set.
}
