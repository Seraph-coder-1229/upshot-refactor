import { defineStore } from "pinia";
import { type AppNotification } from "../types/commonTypes";
import { loggingService } from "../utils/loggingService"; // For logging UI actions if needed

export const useUiStore = defineStore("ui", {
  state: () => ({
    notifications: [] as AppNotification[],
    isLoading: false, // Global loading indicator state
    criticalError: null as Error | null, // Stores a critical, app-breaking error object
    criticalErrorMessage: "" as string, // User-friendly message for the critical error screen
    nextNotificationId: 1, // Simple ID generator
  }),
  actions: {
    /**
     * Adds a notification to be displayed to the user (e.g., as a toast).
     * @param notification - The notification object (message, type, optional duration).
     */
    addNotification(notification: Omit<AppNotification, "id">) {
      const id = this.nextNotificationId++;
      const newNotification: AppNotification = { ...notification, id };

      this.notifications.push(newNotification);
      loggingService.logInfo(
        `UI Notification Added: ${newNotification.type} - ${newNotification.message}`
      );

      // Auto-remove notification after duration, if specified and > 0
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, notification.duration);
      }
    },

    /**
     * Removes a notification by its ID.
     * @param id - The ID of the notification to remove.
     */
    removeNotification(id: number) {
      this.notifications = this.notifications.filter((n) => n.id !== id);
      loggingService.logDebug(`UI Notification Removed: ID ${id}`);
    },

    /**
     * Sets the global loading indicator state.
     * @param status - True to show loading, false to hide.
     */
    setLoading(status: boolean) {
      if (this.isLoading === status) return; // Avoid redundant logging if state is the same
      this.isLoading = status;
      loggingService.logDebug(`UI Loading State Changed: ${status}`);
    },

    /**
     * Sets the application to a critical error state.
     * This will typically trigger a full-screen error display.
     * @param error - The actual Error object.
     * @param userMessage - A user-friendly message to display.
     */
    setCriticalError(error: Error, userMessage: string) {
      this.criticalError = error;
      this.criticalErrorMessage = userMessage;
      this.isLoading = false; // Ensure loading indicator is hidden during critical error
      loggingService.logError("CRITICAL UI ERROR SET:", {
        userMessage,
        errorDetails: error,
      });
    },

    /**
     * Clears the critical error state, allowing the app to potentially be reloaded or reset.
     */
    clearCriticalError() {
      if (this.criticalError) {
        loggingService.logInfo(
          "Critical UI error cleared by user or system action."
        );
      }
      this.criticalError = null;
      this.criticalErrorMessage = "";
    },
  },
});
