import { type AppConfig } from "../types/appConfigTypes";

/**
 * Converts an Excel serial date number into a JavaScript Date object,
 * interpreting it as UTC midnight to avoid timezone shifts.
 * @param excelDate - The serial number for the date from Excel.
 * @returns A JavaScript Date object set to midnight UTC, or null if invalid.
 */
export function excelToJsDate_LocalIntent(excelDate: number): Date | null {
  if (isNaN(excelDate) || excelDate <= 0) return null;
  // The number of days between the Excel epoch (1900-01-01) and the Unix epoch (1970-01-01) is 25569.
  // We subtract this and convert the remaining days to milliseconds.
  const tempDate = new Date((excelDate - 25569) * 86400000);
  const year = tempDate.getUTCFullYear();
  const month = tempDate.getUTCMonth();
  const day = tempDate.getUTCDate();
  return new Date(Date.UTC(year, month, day));
}

/**
 * Converts a JavaScript Date object into an Excel serial date number.
 * @param jsDate - The JavaScript Date object.
 * @returns The serial number representation of the date for Excel.
 */
export function jsDateToExcel(jsDate: Date): number {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const msPerDay = 24 * 60 * 60 * 1000;
  const timeDiff = jsDate.getTime() - excelEpoch.getTime();
  return timeDiff / msPerDay;
}

/**
 * Formats a UTC Date object into a user-friendly local date string (e.g., MM/DD/YYYY).
 * @param utcDate - The UTC Date object to format.
 * @returns The formatted date string, or "N/A" if the date is invalid.
 */
export function formatUtcDateToDisplay(
  utcDate: Date | null | undefined
): string {
  if (!utcDate || isNaN(utcDate.getTime())) return "N/A";
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth();
  const day = utcDate.getUTCDate();
  const localDate = new Date(year, month, day);
  return localDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Adds a specified number of days to a date.
 * @param date - The starting date.
 * @param days - The number of days to add.
 * @returns A new Date object with the days added.
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date.valueOf());
  newDate.setUTCDate(newDate.getUTCDate() + days);
  return newDate;
}

/**
 * Calculates the number of days between two dates.
 * @param date1 - The first date.
 * @param date2 - The second date.
 * @returns The total number of full days between the two dates.
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(
    date1.getUTCFullYear(),
    date1.getUTCMonth(),
    date1.getUTCDate()
  );
  const utc2 = Date.UTC(
    date2.getUTCFullYear(),
    date2.getUTCMonth(),
    date2.getUTCDate()
  );
  return Math.floor((utc2 - utc1) / msPerDay);
}

/**
 * Gets the current date as a UTC Date object at midnight.
 * @returns A new Date object for today at midnight UTC.
 */
export function getTodayUtc(): Date {
  const today = new Date();
  return new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
}

// NOTE: The functions below were part of the original file content provided.
// They are kept for completeness.

export function convertLocalDateToUtcMidnight(localDate: Date): Date {
  return new Date(
    Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  );
}

export function getEffectiveTrainingStartDate(
  actualStartDate: Date,
  appConfig: AppConfig
): Date {
  if (!appConfig.useRoundedTrainingStartDate) {
    return actualStartDate;
  }
  const localInterpretationForRounding = new Date(
    actualStartDate.getUTCFullYear(),
    actualStartDate.getUTCMonth(),
    actualStartDate.getUTCDate()
  );
  const dayOfMonthLocal = localInterpretationForRounding.getDate();
  const effectiveYear = localInterpretationForRounding.getFullYear();
  let effectiveMonth = localInterpretationForRounding.getMonth();
  if (dayOfMonthLocal > 15) {
    effectiveMonth += 1;
  }
  return new Date(Date.UTC(effectiveYear, effectiveMonth, 1));
}

export function parseInputDateToUtc(
  dateString: string | null | undefined
): Date | null {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(Date.UTC(year, month, day));
    }
  }
  return null;
}
