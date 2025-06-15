import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { type Upgrader } from "../../types/personnelTypes";
import { useUiStore } from "../../stores/uiStore";
import {
  excelToJsDate_LocalIntent,
  jsDateToExcel,
} from "../../utils/dateUtils";

const PERSONNEL_FILE_HEADERS = [
  "Rank",
  "Display Name",
  "SHARP Name",
  "Start Date",
  "Assigned Position",
  "Assigned Syllabus Year",
  "Target Qualification Level",
  "On Waiver",
];

interface PersonnelExcelRow {
  Rank?: string;
  "Display Name"?: string;
  "SHARP Name"?: string;
  "Start Date"?: number;
  "Assigned Position"?: string;
  "Assigned Syllabus Year"?: string;
  "Target Qualification Level"?: number;
  "On Waiver"?: string | boolean;
}

export async function processPersonnelFile(file: File): Promise<Upgrader[]> {
  const uiStore = useUiStore();
  const personnel: Upgrader[] = [];
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: PersonnelExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    for (const row of jsonData) {
      const sharpName = row["SHARP Name"];
      const position = row["Assigned Position"];

      if (
        !sharpName ||
        !row["Display Name"] ||
        !row["Start Date"] ||
        !position
      ) {
        continue;
      }

      const startDate = excelToJsDate_LocalIntent(row["Start Date"]);
      if (!startDate) continue;

      const upgrader: Upgrader = {
        id: `${sharpName}-${position}`,
        name: sharpName,
        displayName: row["Display Name"],
        rank: row["Rank"],
        startDate: startDate,
        assignedPosition: position,
        assignedSyllabusYear: String(
          row["Assigned Syllabus Year"] || new Date().getFullYear()
        ),
        targetQualificationLevel: row["Target Qualification Level"] || 200,
        onWaiver: String(row["On Waiver"]).toUpperCase() === "TRUE",
        manuallyUnlockedLevels: [],
        rawCompletions: [],
        allCompletions: [],
      };
      personnel.push(upgrader);
    }
  } catch (error) {
    console.error("Error processing Personnel file:", error);
    uiStore.addNotification({
      message: "Failed to process Personnel file.",
      type: "error",
    });
  }
  return personnel;
}

export function downloadPersonnelData(personnel: Upgrader[]): void {
  const excelData = personnel.map((p) => ({
    Rank: p.rank,
    "Display Name": p.displayName,
    "SHARP Name": p.name,
    "Start Date": jsDateToExcel(p.startDate),
    "Assigned Position": p.assignedPosition,
    "Assigned Syllabus Year": p.assignedSyllabusYear,
    "Target Qual Level": p.targetQualificationLevel,
    "On Waiver": p.onWaiver ? "TRUE" : "FALSE",
  }));
  const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: PERSONNEL_FILE_HEADERS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });
  saveAs(
    dataBlob,
    `Personnel_Data_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

/**
 * Creates and triggers a download for a blank personnel template file.
 */
export function downloadPersonnelTemplate(): void {
  // Create a worksheet with no data, but with the specified headers
  const worksheet = XLSX.utils.json_to_sheet([], {
    header: PERSONNEL_FILE_HEADERS,
  });

  // Create a new workbook and append the sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel Roster");

  // Generate the Excel file buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  // Create a Blob from the buffer for downloading
  const dataBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  // Use file-saver to trigger the download
  saveAs(dataBlob, "Personnel_Template.xlsx");
}
