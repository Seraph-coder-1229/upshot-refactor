// File download/upload helpers (wrappers for FileSaver.js, etc.)
import { saveAs } from "file-saver";
import { type Syllabus } from "@/types/syllabiTypes";
import { useAppConfigStore } from "@/stores/appConfigStore";

// Use 'export const' to create a named export for the service object
export const fileHandlerService = {
  /**
   * Downloads the provided syllabi array as a 'user_syllabi.js' file.
   * @param syllabi - The array of Syllabus objects to download.
   */
  downloadSyllabi(syllabi: Syllabus[]): void {
    const dataStr = `window.UPSHOT_USER_SYLLABI = ${JSON.stringify(
      syllabi,
      null,
      2
    )};`;
    const blob = new Blob([dataStr], { type: "text/javascript;charset=utf-8" });
    saveAs(blob, "user_syllabi.json");
  },

  /**
   * Downloads the application's configuration as a 'user_app_config.js' file.
   */
  downloadAppConfig(): void {
    const appConfigStore = useAppConfigStore();
    const configStr = `window.UPSHOT_USER_APP_CONFIG = ${JSON.stringify(
      appConfigStore.currentConfig,
      null,
      2
    )};`;
    const blob = new Blob([configStr], {
      type: "text/javascript;charset=utf-8",
    });
    saveAs(blob, "user_app_config.json");
  },
};
