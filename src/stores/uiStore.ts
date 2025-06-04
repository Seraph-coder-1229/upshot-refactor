// src/stores/uiStore.ts
// Basic stub - will be fully implemented in Phase 1
import { defineStore } from "pinia";
import { type AppNotification } from "../types/commonTypes"; // Assuming commonTypes.ts exists

export const useUiStore = defineStore("ui", {
  state: () => ({
    notifications: [] as AppNotification[],
    isLoading: false,
    criticalError: null as Error | null,
    criticalErrorMessage: "" as string,
  }),
  actions: {
    addNotification(notification: Omit<AppNotification, "id">) {
      const newNotification = { ...notification, id: Date.now() };
      this.notifications.push(newNotification);
      console.log("[UI-STUB] Add Notification:", newNotification.message);
      // setTimeout(() => this.removeNotification(newNotification.id), notification.duration || 5000);
    },
    removeNotification(id: number) {
      this.notifications = this.notifications.filter((n) => n.id !== id);
    },
    setLoading(status: boolean) {
      this.isLoading = status;
      console.log("[UI-STUB] Set Loading:", status);
    },
    setCriticalError(error: Error, userMessage: string) {
      this.criticalError = error;
      this.criticalErrorMessage = userMessage;
      console.error("[UI-STUB] Set Critical Error:", userMessage, error);
    },
    clearCriticalError() {
      this.criticalError = null;
      this.criticalErrorMessage = "";
    },
  },
});
