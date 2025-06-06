// src/stores/uiStore.ts
import { defineStore } from "pinia";
import { type AppNotification } from "../types/commonTypes"; // Assuming commonTypes.ts exists
import { loggingService } from "../utils/loggingService"; // For logging UI actions

const DEFAULT_NOTIFICATION_DURATION = 3000; // 5 seconds

export const useUiStore = defineStore("ui", {
  state: () => ({
    notifications: [] as AppNotification[],
    isLoading: false,
    criticalError: null as Error | null,
    criticalErrorMessage: "" as string,
    nextNotificationId: 1, // Better way to generate unique IDs
    isGlobalLoading: false,
  }),
  actions: {
    /**
     * Sets the global loading state of the application.
     * @param {boolean} isLoading - Whether the loading indicator should be active.
     */
    setGlobalLoading(isLoading: boolean) {
      this.isGlobalLoading = isLoading;
    },
    addNotification(notification: Omit<AppNotification, "id">) {
      const id = this.nextNotificationId++; // Use incrementing ID
      const duration =
        notification.duration === 0
          ? 0
          : notification.duration || DEFAULT_NOTIFICATION_DURATION; // 0 means persistent

      const newNotification: AppNotification = {
        ...notification,
        id,
        duration,
      };

      this.notifications.push(newNotification);
      loggingService.logInfo(
        `UI Notification Added: ID=${id}, Type=${newNotification.type}, Msg="${newNotification.message}", Duration=${duration}`
      );

      // Auto-remove notification after duration, if duration is positive
      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, duration);
      }
    },

    removeNotification(id: number) {
      const index = this.notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
        loggingService.logDebug(`UI Notification Removed: ID ${id}`);
      }
    },

    setLoading(status: boolean) {
      if (this.isLoading === status) return;
      this.isLoading = status;
      loggingService.logDebug(`UI Loading State Changed: ${status}`);
    },

    setCriticalError(error: Error, userMessage: string) {
      this.criticalError = error;
      this.criticalErrorMessage = userMessage;
      this.isLoading = false;
      loggingService.logError("CRITICAL UI ERROR SET:", {
        userMessage,
        errorDetails: error,
      });
    },

    clearCriticalError() {
      if (this.criticalError) {
        loggingService.logInfo("Critical UI error cleared.");
      }
      this.criticalError = null;
      this.criticalErrorMessage = "";
    },
  },
});
