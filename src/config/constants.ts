export const APP_VERSION = "0.1.0-alpha"; // Or pull from package.json if you have a build step for that
export const MAX_LOG_ENTRIES = 1000;

export const NOTIFICATION_TIME = {
  info: 2000,
  warning: 5000,
  error: 10000,
  default: 2000,
};

export const PERSONNEL_FILE_HEADERS = [
  "Rank",
  "Display Name",
  "SHARP Name",
  "Start Date",
  "Assigned Position",
  "Assigned Syllabus Year",
  "Target Qualification Level",
  "On Waiver",
  // New Headers
  "Syllabus Year L200",
  "Syllabus Year L300",
  "Syllabus Year L400",
];
