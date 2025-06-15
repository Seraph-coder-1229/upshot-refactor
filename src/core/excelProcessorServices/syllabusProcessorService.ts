import * as XLSX from "xlsx";
import {
  type Syllabus,
  type Requirement,
  RequirementType,
} from "../../types/syllabiTypes";
import { loggingService } from "../../utils/loggingService";

const SVC_MODULE = "[SyllabusProcessor]";

// --- NEW: Robust Header Finding Logic ---
/**
 * Finds the correct key in a data row object, ignoring case.
 * @param row - A row object from xlsx.utils.sheet_to_json.
 * @param targetHeader - The header we are looking for (e.g., "Long Name").
 * @returns The actual key from the object, or null if not found.
 */
function findHeaderKey(row: object, targetHeader: string): string | null {
  const lowerCaseTarget = targetHeader.toLowerCase();
  for (const key in row) {
    if (key.trim().toLowerCase() === lowerCaseTarget) {
      return key;
    }
  }
  return null;
}

// Helper function to map the 'Event Subtype' from the Excel file to our internal enum.
function mapSubtypeToRequirementType(subtype: string): RequirementType {
  const upperSubtype = subtype?.toUpperCase() || "";
  if (upperSubtype.includes("BOARD")) return RequirementType.Board;
  const pqsTypes = ["PQS", "FUNDAMENTAL", "SYSTEM", "ICW", "POWERPOINT"];
  if (pqsTypes.some((t) => upperSubtype.includes(t)))
    return RequirementType.PQS;
  const eventTypes = [
    "FLIGHT",
    "LAB",
    "WTT",
    "PTT",
    "WST",
    "PST",
    "ACFT GND EVENT",
  ];
  if (eventTypes.some((t) => upperSubtype.includes(t)))
    return RequirementType.Event;
  return RequirementType.Other;
}

/** Helper to parse the syllabus identifier string.
 */
function parseMasterSyllabusIdentifier(identifier: string | null | undefined): {
  year: string;
  position: string;
  baseName: string;
} {
  const trimmedIdentifier = identifier?.trim() || "UNKNOWN";

  let year = new Date().getFullYear().toString();
  const yearMatch = trimmedIdentifier.match(/\b(20\d{2})\b/);
  if (yearMatch) year = yearMatch[0];

  let position = "UNKNOWN";
  const positionMatch = trimmedIdentifier.match(/\b(PILOT|NFO|EWO|AAW|AAS)\b/i);
  if (positionMatch) position = positionMatch[0].toUpperCase();

  return { year, position, baseName: trimmedIdentifier };
}

/**
 * Parses a SHARP Syllabus Export Excel file and creates a single, comprehensive Syllabus object.
 * @param file - The SHARP Syllabus Export .xlsx file.
 * @returns A promise that resolves to an array containing the single parsed Syllabus.
 */
export async function excelSyllabusProcessorService(
  file: File
): Promise<Syllabus[]> {
  console.log(`${SVC_MODULE} Processing file: ${file.name}`);
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });

    if (workbook.SheetNames.length < 3) {
      throw new Error(
        `Expected at least 3 sheets, but the workbook only has ${workbook.SheetNames.length}.`
      );
    }

    const syllabusSheet = workbook.Sheets["Syllabus and Stages"];
    const eventsSheet = workbook.Sheets["Syllabus Events"];
    const defaultSheet = workbook.Sheets["Default"];

    if (!syllabusSheet || !eventsSheet || !defaultSheet) {
      throw new Error(
        "One or more required sheets (Syllabus and Stages, Syllabus Events, Default) are missing."
      );
    }

    // --- Step 1: Initialize master syllabus ---
    const syllabusSheetData: any[] = XLSX.utils.sheet_to_json(syllabusSheet, {
      range: 2,
    });
    const syllabusInfo = syllabusSheetData[0] || {};
    const syllabusNameKey = findHeaderKey(syllabusInfo, "Syllabus Name");
    const syllabusTitleKey = findHeaderKey(syllabusInfo, "Syllabus Title");
    const syllabusIdentifier = syllabusInfo[syllabusNameKey!] || file.name;
    const parsedInfo = parseMasterSyllabusIdentifier(syllabusIdentifier);
    const masterSyllabus: Syllabus = {
      id: syllabusInfo[syllabusNameKey!] || file.name,
      name: syllabusInfo[syllabusNameKey!] || "Unknown Syllabus",
      displayName: syllabusInfo[syllabusTitleKey!] || "Unknown Syllabus",
      position: parsedInfo.position.toUpperCase(),
      year: parsedInfo.year,
      baseLevel: "200",
      requirements: [],
      masterSyllabusIdentifier: null,
    };
    loggingService.logInfo(
      `${SVC_MODULE} Initialized master syllabus: ${masterSyllabus.name}`
    );

    // --- Step 2: Parse all requirements from "Syllabus Events" sheet ---
    const eventsSheetData: any[] = XLSX.utils.sheet_to_json(eventsSheet, {
      range: 1,
    });
    const requirementsMap = new Map<string, Requirement>();

    if (eventsSheetData.length > 0) {
      const firstReqRow = eventsSheetData[0];
      // Find all the header keys we need, case-insensitively
      const longNameKey = findHeaderKey(firstReqRow, "Long name");
      const shortNameKey = findHeaderKey(firstReqRow, "Short Name");
      const parentKey = findHeaderKey(firstReqRow, "Parent");
      const subtypeKey = findHeaderKey(firstReqRow, "Event Subtype");
      const prereqsKey = findHeaderKey(firstReqRow, "Prerequisites");
      const requiredKey = findHeaderKey(firstReqRow, "Required");

      if (!longNameKey || !shortNameKey) {
        throw new Error(
          "Could not find 'Long name' or 'Short Name' column in 'Syllabus Events' sheet."
        );
      }

      for (const row of eventsSheetData) {
        const shortName = row[shortNameKey];
        if (!shortName) continue; // Use Short Name as the key existence check

        const longName = row[longNameKey] || shortName; // Fallback to short name if long name is empty
        const levelMatch = String(row[parentKey!]).match(/\d+/);
        const level = levelMatch ? levelMatch[0] : "0";
        const requiredValue = requiredKey ? row[requiredKey] || "" : "";
        let isDefaultWaived = requiredValue.toUpperCase() !== "X";

        if (row[subtypeKey!].includes("ICW")) {
          isDefaultWaived = true;
        }
        const newRequirement: Requirement = {
          id: shortName, // Use the Short Name as the stable ID
          name: shortName, // Use the Short Name for matching against training data headers
          displayName: shortName,
          description: longName, // Store the full name in the description field
          level: level,
          type: mapSubtypeToRequirementType(row[subtypeKey!]),
          rawSharpEventSubtype: row[subtypeKey!],
          prerequisites: (row[prereqsKey!] || "").split("\n").filter(Boolean),
          isDefaultWaived: isDefaultWaived,
        };
        masterSyllabus.requirements.push(newRequirement);
        // Use the short name as the key for the map as well
        requirementsMap.set(shortName, newRequirement);
      }
    }
    loggingService.logInfo(
      `${SVC_MODULE} Parsed ${masterSyllabus.requirements.length} requirements from 'Syllabus Events'.`
    );

    // --- Step 3: Add sequence numbers from "Default" sheet ---
    const defaultSheetData: any[] = XLSX.utils.sheet_to_json(defaultSheet, {
      range: 1,
    });
    if (defaultSheetData.length > 0) {
      const firstDefRow = defaultSheetData[0];
      const eventKey = findHeaderKey(firstDefRow, "Syllabus event");
      const seqKey = findHeaderKey(firstDefRow, "Sequence");

      if (eventKey && seqKey) {
        for (const row of defaultSheetData) {
          const requirementIdFromSheet = row[eventKey]
            ?.split("/")
            .pop()
            ?.trim();
          const requirement = masterSyllabus.requirements.find((r) =>
            r.name.includes(requirementIdFromSheet)
          );

          if (requirement && row[seqKey]) {
            requirement.sequence = parseInt(row[seqKey], 10);
          }
        }
      }
    }
    loggingService.logInfo(
      `${SVC_MODULE} Added sequence data from 'Default' sheet.`
    );
    return [masterSyllabus];
  } catch (error) {
    loggingService.logError(
      `${SVC_MODULE} Failed to process syllabus file.`,
      error
    );
    return [];
  }
}
