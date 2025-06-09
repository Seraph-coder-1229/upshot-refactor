import * as XLSX from "xlsx";
import { excelToJsDate_LocalIntent } from "../../utils/dateUtils";
import { useUiStore } from "../../stores/uiStore";
import { loggingService } from "../../utils/loggingService";

const SVC_MODULE = "[TrainingDataProcessor]";

// Type definitions for the data this processor will produce
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
    // We will not use cellDates, instead handling parsing manually with debugging.
    const workbook = XLSX.read(data, { type: "array" });

    const sheets: { [name: string]: any[][] } = {};
    const sheetNames = ["Date Received", "Instructor", "Grade", "Status"];

    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) throw new Error(`Required sheet "${name}" not found.`);
      // Set raw: false to get formatted strings, which helps with string-based dates
      sheets[name] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
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
    const pqsVersionName = header[nameColIndex + 1] || "Unknown PQS Version";
    detectedTrack = detectTrackFromPqsVersion(pqsVersionName);

    const specialColumns = new Map<
      number,
      { type: "pqs" | "actc"; level?: number }
    >();
    specialColumns.set(nameColIndex + 1, { type: "pqs" });
    header.forEach((h, i) => {
      if (typeof h === "string") {
        const actcMatch = h.match(/Level\s*(\d{3})/i);
        if (actcMatch && actcMatch[1]) {
          specialColumns.set(i, {
            type: "actc",
            level: parseInt(actcMatch[1], 10),
          });
        }
      }
    });
    console.table(
      [...specialColumns.entries()].map(([colIndex, info]) => ({
        "Column Index": colIndex,
        Type: info.type,
        Level: info.level ?? "N/A",
      }))
    );

    loggingService.logInfo(
      `${SVC_MODULE} Starting to process ${
        dateSheetRows.length - dataStartIndex
      } student rows...`
    );
    for (let i = dataStartIndex; i < dateSheetRows.length; i++) {
      const name = sheets["Date Received"][i][nameColIndex];
      if (!name) continue;

      const studentData: ProcessedStudentData = {
        nameFromSharpFile: name,
        pqsVersionName: pqsVersionName,
        completions: [],
        actcLevelStatuses: new Map(),
      };

      loggingService.logDebug(`${SVC_MODULE} Processing row for: ${name}`);

      for (let j = nameColIndex + 1; j < header.length; j++) {
        const eventName = header[j];
        if (!eventName) continue;
        if (specialColumns.has(j)) {
          const specialInfo = specialColumns.get(j)!;
          if (specialInfo.type === "actc" && specialInfo.level) {
            const status = sheets["Status"][i][j] || "Not Started";
            studentData.actcLevelStatuses.set(specialInfo.level, status);
            continue; // Skip ACTC level columns
          }
        }

        const dateValue = sheets["Date Received"][i][j];
        let parsedDate: Date | null = null;

        if (dateValue != null && dateValue !== "") {
          // --- DEBUGGING LOGIC ---
          loggingService.logDebug(
            `${SVC_MODULE}   Event: "${eventName}", Raw Value: "${dateValue}", Type: ${typeof dateValue}`
          );

          if (typeof dateValue === "number") {
            parsedDate = excelToJsDate_LocalIntent(dateValue);
            loggingService.logDebug(
              `${SVC_MODULE}     -> Parsed as Excel Number. Result: ${parsedDate?.toISOString()}`
            );
          } else if (typeof dateValue === "string") {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) {
              parsedDate = d;
              loggingService.logDebug(
                `${SVC_MODULE}     -> Parsed as String. Result: ${parsedDate?.toISOString()}`
              );
            }
          } else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            parsedDate = dateValue;
            loggingService.logDebug(
              `${SVC_MODULE}     -> Value was already a JS Date object.`
            );
          }
        }

        if (parsedDate) {
          studentData.completions.push({
            event: eventName,
            date: parsedDate,
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
  console.log(`${SVC_MODULE} Processed ${processedData.size} student records.`);
  console.log(processedData);
  return { detectedTrack, data: processedData };
}
