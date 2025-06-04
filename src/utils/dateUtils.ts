/**
 * Converts an Excel serial date number (assumed to represent a local date)
 * into a JavaScript Date object, attempting to preserve the local date interpretation
 * by creating a UTC date with the same Y/M/D components.
 * This helps avoid timezone shifts when later converting back to local for display.
 */
export function excelToJsDate_LocalIntent(excelDate: number): Date | null {
  if (isNaN(excelDate) || excelDate <= 0) return null;
  // This creates a JS Date object. The key is how SheetJS interprets it.
  // If SheetJS with cellDates:true produces a JS Date that, when you use
  // getFullYear(), getMonth(), getDate(), gives you the local date numbers from Excel,
  // we then need to ensure these are treated as the intended Y/M/D for UTC storage.

  // Let's assume SheetJS's cellDates:true gives a JS Date object where
  // its internal time value results in getFullYear(), getMonth(), getDate()
  // reflecting the local date shown in Excel.
  const tempDate = new Date((excelDate - 25569) * 86400000); // This is UTC midnight for that date in Excel's 1900 system

  // To "fix" it to the user's local Y/M/D parts but store as UTC midnight:
  const year = tempDate.getUTCFullYear();
  const month = tempDate.getUTCMonth(); // 0-indexed
  const day = tempDate.getUTCDate();

  return new Date(Date.UTC(year, month, day));
}

// OR, if SheetJS `cellDates: true` truly gives a JS Date object that *already*
// represents the local date correctly when using local methods (getFullYear, etc.)
// then the conversion to a consistent UTC representation for storage is:
export function convertLocalDateToUtcMidnight(localDate: Date): Date {
  return new Date(
    Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  );
}

import { type AppConfig } from "../types/appConfigTypes";

export function getEffectiveTrainingStartDate(
  actualStartDate: Date, // This should be a UTC Date representing the actual start (e.g., midnight UTC on that day)
  appConfig: AppConfig
): Date {
  if (!appConfig.useRoundedTrainingStartDate) {
    return actualStartDate; // Return the UTC date as is
  }

  // For rounding, we need to consider the "local" day of the month
  // So, we convert our stored UTC date to the user's local representation FOR THE DECISION
  // then create a NEW UTC date based on the rounding.

  // Create a date object that will give us local parts based on the stored UTC value
  const localInterpretationForRounding = new Date(
    actualStartDate.getUTCFullYear(),
    actualStartDate.getUTCMonth(),
    actualStartDate.getUTCDate()
  );

  const dayOfMonthLocal = localInterpretationForRounding.getDate(); // Local day

  const effectiveYear = localInterpretationForRounding.getFullYear();
  let effectiveMonth = localInterpretationForRounding.getMonth(); // 0-indexed

  if (dayOfMonthLocal > 15) {
    effectiveMonth += 1;
    // No need to handle month overflow for new Date(Date.UTC(...)) as it handles it.
  }
  // Create new date object for the 1st of the determined effective month/year, as UTC midnight
  return new Date(Date.UTC(effectiveYear, effectiveMonth, 1));
}

/**
 * Formats a stored UTC Date object into a user-friendly local date string (e.g., MM/DD/YYYY).
 */
export function formatUtcDateToDisplay(
  utcDate: Date | null | undefined
): string {
  if (!utcDate || isNaN(utcDate.getTime())) return "N/A";

  // Create a new Date object from the UTC date's components to ensure correct local interpretation
  // The stored utcDate is already UTC midnight. new Date(string) can be unreliable.
  // To get YYYY, MM, DD components as they were at UTC:
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth(); // 0-indexed
  const day = utcDate.getUTCDate();

  // Create a new date object that will be formatted in the system's local timezone
  // using those UTC components. This ensures if it was "June 3rd UTC", it shows as "June 3rd local".
  const localDate = new Date(year, month, day);

  return localDate.toLocaleDateString(undefined, {
    // undefined uses browser default locale
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Parses a date string from an input type="date" (YYYY-MM-DD),
 * assuming it represents a local date, and converts to a UTC Date object (midnight).
 */
export function parseInputDateToUtc(
  dateString: string | null | undefined
): Date | null {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(Date.UTC(year, month, day));
    }
  }
  return null; // Invalid format
}
