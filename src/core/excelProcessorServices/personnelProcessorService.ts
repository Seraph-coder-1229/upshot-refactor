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
  // New Headers
  "Syllabus Year L200",
  "Syllabus Year L300",
  "Syllabus Year L400",
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
  // New Row Properties
  "Syllabus Year L200"?: string;
  "Syllabus Year L300"?: string;
  "Syllabus Year L400"?: string;
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
        levelSyllabusYears: {
          "200": row["Syllabus Year L200"] || "",
          "300": row["Syllabus Year L300"] || "",
          "400": row["Syllabus Year L400"] || "",
        },
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
    "Target Qualification Level": p.targetQualificationLevel,
    "On Waiver": p.onWaiver ? "TRUE" : "FALSE",
    "Syllabus Year L200": p.levelSyllabusYears?.["200"],
    "Syllabus Year L300": p.levelSyllabusYears?.["300"],
    "Syllabus Year L400": p.levelSyllabusYears?.["400"],
  }));
  const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: PERSONNEL_FILE_HEADERS, // Ensure headers are in order
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

export function downloadPersonnelTemplate(): void {
  const worksheet = XLSX.utils.json_to_sheet([], {
    header: PERSONNEL_FILE_HEADERS,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel Roster");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  saveAs(dataBlob, "Personnel_Template.xlsx");
}
