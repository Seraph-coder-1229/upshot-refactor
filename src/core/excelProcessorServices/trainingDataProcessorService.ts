import * as XLSX from "xlsx";
import { excelToJsDate_LocalIntent } from "../../utils/dateUtils";
import { useUiStore } from "../../stores/uiStore";

export interface DetailedCompletionRecord {
  event: string;
  date: Date;
  instructor?: string;
  grade?: number | string;
  status?: string;
}

export interface ProcessedStudentData {
  nameFromSharpFile: string;
  pqsVersionName?: string;
  pqsVersionStatus?: string;
  actcLevelStatuses: Map<number, string>;
  completions: DetailedCompletionRecord[];
}

export type ProcessedSharpDataMap = Map<string, ProcessedStudentData>;

export interface ProcessedSharpFile {
  detectedTrack: string | null;
  data: ProcessedSharpDataMap;
}

function detectTrackFromPqsVersion(pqsVersion: string): string | null {
  if (!pqsVersion) return null;
  // This regex looks for a 3-letter uppercase word, a common pattern for tracks (AAW, SUW, etc.)
  const match = pqsVersion.match(/\b([A-Z]{3})\b/);
  return match ? match[1] : null;
}

export async function processSharpTrainingFile(
  file: File
): Promise<ProcessedSharpFile> {
  const uiStore = useUiStore();
  const processedData: ProcessedSharpDataMap = new Map();
  let detectedTrack: string | null = null;

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheets: { [name: string]: any[][] } = {};
    const sheetNames = ["Date Received", "Instructor", "Grade", "Status"];
    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) throw new Error(`Required sheet "${name}" not found.`);
      sheets[name] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
      });
    }

    const dateSheetRows = sheets["Date Received"];
    const headerRowIndex = dateSheetRows.findIndex((row) =>
      row.some(
        (cell) =>
          typeof cell === "string" && cell.toUpperCase().includes("NAME")
      )
    );
    if (headerRowIndex === -1) throw new Error("Could not locate header row.");

    const header = dateSheetRows[headerRowIndex];
    const nameColIndex = header.findIndex(
      (cell) => typeof cell === "string" && cell.toUpperCase().includes("NAME")
    );
    const dataStartIndex = headerRowIndex + 1;

    // --- NEW: Identify special status columns ---
    const specialColumns = new Map<
      number,
      { type: "pqs" | "actc"; level?: number }
    >();
    const pqsVersionName = header[nameColIndex + 1] || "Unknown PQS Version";
    detectedTrack = detectTrackFromPqsVersion(pqsVersionName);
    specialColumns.set(nameColIndex + 1, { type: "pqs" });
    header.forEach((h, i) => {
      if (typeof h === "string") {
        const actcMatch = h.match(/ACTC\s*(\d{3})/i);
        if (actcMatch && actcMatch[1]) {
          specialColumns.set(i, {
            type: "actc",
            level: parseInt(actcMatch[1], 10),
          });
        }
      }
    });

    for (let i = dataStartIndex; i < dateSheetRows.length; i++) {
      const name = sheets["Date Received"][i][nameColIndex];
      if (!name) continue;

      const studentData: ProcessedStudentData = {
        nameFromSharpFile: name,
        pqsVersionName: pqsVersionName,
        completions: [],
        actcLevelStatuses: new Map(),
      };

      // --- Process special and event columns ---
      for (let j = nameColIndex + 1; j < header.length; j++) {
        const eventName = header[j];
        if (!eventName) continue;

        // Handle as a special status column
        if (specialColumns.has(j)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const specialInfo = specialColumns.get(j)!;
          const statusValue = sheets["Date Received"][i][j]; // Status is consistent across sheets
          if (specialInfo.type === "pqs") {
            studentData.pqsVersionStatus = statusValue;
          } else if (specialInfo.type === "actc" && specialInfo.level) {
            studentData.actcLevelStatuses.set(specialInfo.level, statusValue);
          }
        }
        // Handle as a regular event completion column
        else {
          const dateValue = sheets["Date Received"][i][j];
          if (!dateValue || typeof dateValue !== "number") continue;
          const date = excelToJsDate_LocalIntent(dateValue);
          if (!date) continue;

          studentData.completions.push({
            event: eventName,
            date: date,
            instructor: sheets["Instructor"][i]?.[j] || undefined,
            grade: sheets["Grade"][i]?.[j] || undefined,
            status: sheets["Status"][i]?.[j] || undefined,
          });
        }
      }
      processedData.set(name, studentData);
    }
  } catch (error) {
    console.error("Error processing SHARP Training File:", error);
    uiStore.addNotification({
      message: `An error occurred processing the SHARP file.`,
      type: "error",
    });
    return { detectedTrack: null, data: new Map() };
  }
  return { detectedTrack, data: processedData };
}
