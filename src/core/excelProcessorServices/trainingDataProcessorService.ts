import * as XLSX from "xlsx";
import { excelToJsDate_LocalIntent } from "../../utils/dateUtils";
import { useUiStore } from "../../stores/uiStore";
import { loggingService } from "../../utils/loggingService";
import { DetailedCompletionRecord, Upgrader } from "@/types/personnelTypes"; // Import the type from its new home

const SVC_MODULE = "[TrainingDataProcessor]";

// Type definitions for the data this processor will produce
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
    const workbook = XLSX.read(data, { type: "array" });

    const sheets: { [name: string]: any[][] } = {};
    const sheetNames = ["Date Received", "Instructor", "Grade", "Status"];

    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet) throw new Error(`Required sheet "${name}" not found.`);
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

    for (let i = dataStartIndex; i < dateSheetRows.length; i++) {
      const name = sheets["Date Received"][i][nameColIndex];
      if (!name) continue;

      const studentData: ProcessedStudentData = {
        nameFromSharpFile: name,
        pqsVersionName: pqsVersionName,
        completions: [],
        actcLevelStatuses: new Map(),
      };

      for (let j = nameColIndex + 1; j < header.length; j++) {
        const eventName = header[j];
        if (!eventName) continue;
        if (specialColumns.has(j)) {
          const specialInfo = specialColumns.get(j)!;
          if (specialInfo.type === "actc" && specialInfo.level) {
            const status = sheets["Status"][i][j] || "Not Started";
            studentData.actcLevelStatuses.set(specialInfo.level, status);
            continue;
          }
        }

        const dateValue = sheets["Date Received"][i][j];
        let parsedDate: Date | null = null;

        if (dateValue != null && dateValue !== "") {
          if (typeof dateValue === "number") {
            parsedDate = excelToJsDate_LocalIntent(dateValue);
          } else if (typeof dateValue === "string") {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) parsedDate = d;
          } else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            parsedDate = dateValue;
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

  return { detectedTrack, data: processedData };
}

// src/core/services/trainingDataProcessorService.ts

import type { DataSet } from "@/types/dataSetTypes";
// Assuming your other types are structured as we discussed
import type { CompletedItemRecord } from "@/types/syllabiTypes";
import type { ImportReport } from "@/types/reportTypes";
import type { PersonnelWithNoSyllabus } from "@/types/personnelTypes";

// This is a placeholder type for the return value of this service.
// It's everything in a DataSet except the fields generated by the store.
type ProcessedData = Omit<DataSet, "id" | "name" | "createdAt">;

/**
 * Processes an array of uploaded files (e.g., SHARP reports) and transforms
 * them into a structured, un-ID'd DataSet object. This service is stateless
 * and does not interact with the Pinia store.
 *
 * @param {File[]} files - The array of files to process.
 * @returns {Promise<ProcessedData>} A promise that resolves to an object
 * containing all the processed data, ready to be added to a new DataSet.
 */
export const processFilesToDataSet = async (
  files: File[]
): Promise<ProcessedData> => {
  // =========================================================================
  // NOTE FOR DEV TEAM:
  // This is where the existing, complex logic for parsing Excel files,
  // extracting records, and matching personnel to syllabi will live.
  // The original logic from the old `processSharpReport` action should be
  // moved here and adapted.
  // =========================================================================

  console.log(
    "Processing files:",
    files.map((f) => f.name)
  );

  // --- MOCK IMPLEMENTATION FOR STUBBING ---
  // In the real implementation, you will loop through the files, parse them,
  // and aggregate the results into these arrays.

  const mockCompletionRecords: CompletedItemRecord[] = [
    // Mock data would be generated here based on file content
    // { student: 'John Doe', event: 'Event 101', date: '2025-06-25', grade: 'Pass', instructor: 'Jane Smith' }
  ];

  const mockPersonnelWithNoSyllabus: PersonnelWithNoSyllabus[] = [
    // { name: 'Peter Pan', unmatchedTrackName: 'Neverland Pilot' }
  ];

  const mockImportReport: ImportReport = {
    fileNames: files.map((f) => f.name),
    track: "Multiple", // Or derive from file content
    reportDate: new Date(),
    personnelFound: 20, // Mock value
    recordsProcessed: 150, // Mock value
    matchedPersonnel: 18, // Mock value
  };
  // --- END MOCK IMPLEMENTATION ---

  // In the final implementation, the arrays above will be populated with real data
  // extracted from the `files` argument.

  return {
    completionRecords: mockCompletionRecords,
    importSummary: mockImportReport,
    personnelWithNoSyllabus: mockPersonnelWithNoSyllabus,
  };
};
