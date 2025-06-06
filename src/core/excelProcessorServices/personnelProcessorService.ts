import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { type Upgrader } from "../../types/personnelTypes";
import { useUiStore } from "../../stores/uiStore";
import {
  excelToJsDate_LocalIntent,
  jsDateToExcel,
} from "../../utils/dateUtils";

// Define the expected header columns in the Personnel Excel file.
const PERSONNEL_FILE_HEADERS = [
  "Rank",
  "Display Name",
  "SHARP Name",
  "Start Date",
  "Assigned Position",
  "Assigned Syllabus Year",
  "Target Qual Level",
  "On Waiver",
];

interface PersonnelExcelRow {
  Rank?: string;
  "Display Name"?: string;
  "SHARP Name"?: string;
  "Start Date"?: number;
  "Assigned Position"?: string;
  "Assigned Syllabus Year"?: string;
  "Target Qual Level"?: number;
  "On Waiver"?: string | boolean;
}

export async function processPersonnelFile(file: File): Promise<Upgrader[]> {
  const uiStore = useUiStore();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData: PersonnelExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  const personnel: Upgrader[] = [];

  for (const row of jsonData) {
    if (!row["SHARP Name"] || !row["Display Name"] || !row["Start Date"]) {
      console.warn("Skipping row due to missing required fields:", row);
      continue;
    }
    try {
      // Use the corrected date function name here
      const startDate = excelToJsDate_LocalIntent(row["Start Date"]);

      if (!startDate) {
        console.warn("Skipping row due to invalid start date:", row);
        continue;
      }

      const upgrader: Upgrader = {
        id: row["SHARP Name"],
        name: row["SHARP Name"],
        displayName: row["Display Name"],
        rank: row["Rank"],
        startDate: startDate, // Assign the parsed date
        assignedPosition: row["Assigned Position"] || "Default",
        assignedSyllabusYear: String(
          row["Assigned Syllabus Year"] || new Date().getFullYear()
        ),
        targetQualificationLevel: row["Target Qual Level"] || 200,
        onWaiver: String(row["On Waiver"]).toUpperCase() === "TRUE",
        allCompletions: [],
        rawCompletions: [],
      };
      personnel.push(upgrader);
    } catch (error) {
      uiStore.addNotification({
        message: `Error parsing a row in the personnel file.`,
        type: "error",
      });
      console.error("Error parsing personnel row:", row, error);
    }
  }
  return personnel;
}

export function downloadPersonnelTemplate(): void {
  const uiStore = useUiStore();
  try {
    const defaultData: PersonnelExcelRow[] = [
      {
        Rank: "LT",
        "Display Name": "Jane Doe",
        "SHARP Name": "DOE, JANE A",
        "Start Date": 45291,
        "Assigned Position": "PILOT",
        "Assigned Syllabus Year": "2024",
        "Target Qual Level": 300,
        "On Waiver": "FALSE",
      },
      {
        Rank: "LCDR",
        "Display Name": "John Smith",
        "SHARP Name": "SMITH, JOHN B",
        "Start Date": 45000,
        "Assigned Position": "EWO",
        "Assigned Syllabus Year": "2023",
        "Target Qual Level": 400,
        "On Waiver": "TRUE",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(defaultData, {
      header: PERSONNEL_FILE_HEADERS,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Personnel_Template.xlsx");
  } catch (error) {
    uiStore.addNotification({
      message: `Failed to download the personnel template.`,
      type: "error",
    });
    console.error("Error generating personnel template:", error);
  }
}

/**
 * Generates and downloads an Excel file from the current personnel data.
 * @param personnel - An array of Upgrader objects from the store.
 */
export function downloadPersonnelData(personnel: Upgrader[]): void {
  const uiStore = useUiStore();
  if (!personnel || personnel.length === 0) {
    uiStore.addNotification({
      message: "No personnel data to download.",
      type: "warning",
    });
    return;
  }

  try {
    // 1. Map Upgrader data back to the simple Excel row format
    const excelData = personnel.map((p) => ({
      Rank: p.rank,
      "Display Name": p.displayName,
      "SHARP Name": p.name, // 'name' holds the SHARP Name
      "Start Date": jsDateToExcel(p.startDate), // Convert date back to Excel format
      "Assigned Position": p.assignedPosition,
      "Assigned Syllabus Year": p.assignedSyllabusYear,
      "Target Qual Level": p.targetQualificationLevel,
      "On Waiver": p.onWaiver ? "TRUE" : "FALSE",
    }));

    // 2. Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData, {
      header: PERSONNEL_FILE_HEADERS,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel");

    // 3. Generate and download the file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    saveAs(data, `Personnel_Data_${timestamp}.xlsx`);
  } catch (error) {
    uiStore.addNotification({
      message: "Failed to generate the personnel Excel file.",
      type: "error",
    });
    console.error("Error downloading personnel data:", error);
  }
}
