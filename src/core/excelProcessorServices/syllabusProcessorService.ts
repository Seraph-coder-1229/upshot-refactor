// src/core/excelProcessorService.ts
import * as XLSX from "xlsx";
import {
  type Syllabus,
  type Requirement,
  type RequirementTypeInternal,
} from "../../types/syllabiTypes"; // Ensure path is correct
import { loggingService } from "../../utils/loggingService"; // Ensure path is correct

const SVC_MODULE = "[ExcelProcessorService]";

/**
 * Helper to parse the master syllabus identifier string from Sheet 1, Cell A4.
 */
function parseMasterSyllabusIdentifier(identifier: string | null | undefined): {
  year: string;
  position: string;
  baseName: string;
  originalIdentifier: string;
} {
  const originalIdentifier = identifier || "UNKNOWN_IDENTIFIER";
  if (
    !identifier ||
    typeof identifier !== "string" ||
    identifier.trim() === ""
  ) {
    loggingService.logError(
      `${SVC_MODULE} Master syllabus identifier (from A4) is null, undefined, or empty.`
    );
    return {
      year: "ERR_YEAR",
      position: "ERR_POS",
      baseName: "ERR_BASENAME",
      originalIdentifier,
    };
  }

  const trimmedIdentifier = identifier.trim();
  let year = new Date().getFullYear().toString();
  const yearMatch = trimmedIdentifier.match(/\b(20\d{2})\b/);
  if (yearMatch && yearMatch[0]) year = yearMatch[0];
  else
    loggingService.logWarn(
      `${SVC_MODULE} Could not extract year from master identifier "${trimmedIdentifier}". Defaulting to ${year}.`
    );

  let position = "UNKNOWN_POS";
  const knownPositions = ["PILOT", "NFO", "EWO", "AAW"]; // Ensure these are exhaustive
  const upperIdentifier = trimmedIdentifier.toUpperCase();
  for (const p of knownPositions) {
    if (upperIdentifier.includes(p)) {
      position = p;
      break;
    }
  }
  if (position === "UNKNOWN_POS")
    loggingService.logWarn(
      `${SVC_MODULE} Could not extract known position from "${trimmedIdentifier}". Result: ${position}.`
    );

  let baseName = trimmedIdentifier;
  if (yearMatch && yearMatch[0]) baseName = baseName.replace(yearMatch[0], "");
  if (position !== "UNKNOWN_POS") {
    const positionRegex = new RegExp(
      position.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    baseName = baseName.replace(positionRegex, "");
  }
  baseName = baseName
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .trim();
  if (!baseName) baseName = "SYLLABUS"; // Fallback baseName

  loggingService.logDebug(
    `${SVC_MODULE} Parsed A4 "${originalIdentifier}" -> Year=${year}, Pos=${position}, Base=${baseName}`
  );
  return { year, position, baseName, originalIdentifier: trimmedIdentifier };
}

/**
 * Generates a consistent ID for a Requirement.
 */
function generateRequirementId(
  parentSyllabusId: string,
  requirementDescription: string
): string {
  if (!requirementDescription?.trim())
    return `${parentSyllabusId}::REQ::INVALID_DESC_${Date.now()}`;
  const cleanDescription = requirementDescription
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();
  return `${parentSyllabusId}::REQ::${cleanDescription}`;
}

/**
 * Maps SHARP Event Subtypes.
 */
function mapSharpEventSubtype(sharpSubtype: string | undefined | null): {
  type: RequirementTypeInternal;
  isWaived: boolean;
} {
  const subtype = (sharpSubtype || "").trim().toUpperCase();
  if (subtype === "OTHER QUAL") return { type: "OtherWaived", isWaived: true };
  if (
    ["FLIGHT", "ICW", "ACFT GND EVENT", "PST", "AIRCRAFT", "OFT"].some((s) =>
      subtype.includes(s)
    )
  )
    return { type: "Event", isWaived: false };
  if (
    ["FUNDAMENTAL", "SYSTEM", "BOARD", "LAB", "DISCUSSION"].some((s) =>
      subtype.includes(s)
    )
  )
    return { type: "PQS", isWaived: false };
  if (subtype)
    loggingService.logDebug(
      `${SVC_MODULE} Unknown SHARP Event Subtype: "${sharpSubtype}". Defaulting to 'Event'.`
    );
  return { type: "Event", isWaived: false };
}

/**
 * Parses a raw prerequisite string from SHARP.
 */
function resolvePrerequisiteStringToId(
  prereqDescString: string,
  allSyllabusDefinitionsFromSheet1: Syllabus[],
  allParsedRequirementsMap: Map<string, Requirement>
): string | null {
  const originalPrereqStr = prereqDescString;
  loggingService.logDebug(
    `${SVC_MODULE} [PrereqResolver] Attempting to resolve: "${originalPrereqStr}"`
  );

  const parts = originalPrereqStr.split("/");
  if (parts.length < 3) {
    loggingService.logWarn(
      `${SVC_MODULE} [PrereqResolver] Malformed prereq string (not enough parts '${parts.length}'): "${originalPrereqStr}"`
    );
    return null;
  }

  const masterSyllabusNameAndVersionFromFile = parts[0].trim();
  const levelStringFromFile = parts[1].trim();
  let itemDescriptionFromFile = parts.slice(2).join("/").trim();

  const levelMatch = levelStringFromFile.match(/\b(100|200|300|400|500)\b/);
  if (!levelMatch?.[0]) {
    loggingService.logWarn(
      `${SVC_MODULE} [PrereqResolver] No level in part: "${levelStringFromFile}" from "${originalPrereqStr}"`
    );
    return null;
  }
  const prereqItemLevel = parseInt(levelMatch[0]);

  itemDescriptionFromFile = itemDescriptionFromFile
    .replace(
      /\s*\((Event|PQS|OtherWaived|System|Flight|Fundamental|ICW|Board|Lab|Discussion|PST|Aircraft|OFT|Other Qual)\)\s*(\(Default\))?$/i,
      ""
    )
    .trim();
  if (!itemDescriptionFromFile) {
    loggingService.logWarn(
      `${SVC_MODULE} [PrereqResolver] Item description part is empty after cleaning from "${originalPrereqStr}"`
    );
    return null;
  }

  loggingService.logDebug(
    `${SVC_MODULE} [PrereqResolver] Parsed from "${originalPrereqStr}": MasterSylAndVer="${masterSyllabusNameAndVersionFromFile}", PrereqLvl=${prereqItemLevel}, CleanedItemDesc="${itemDescriptionFromFile}"`
  );

  const parentSyllabusForPrereq = allSyllabusDefinitionsFromSheet1.find(
    (s) =>
      s.pqsVersionRef === masterSyllabusNameAndVersionFromFile &&
      s.level === prereqItemLevel
  );

  if (!parentSyllabusForPrereq) {
    loggingService.logWarn(
      `${SVC_MODULE} [PrereqResolver] Parent syllabus for prereq NOT FOUND: MasterSylAndVer="${masterSyllabusNameAndVersionFromFile}", Level=${prereqItemLevel}. String: "${originalPrereqStr}".`
    );
    loggingService.logDebug(
      `${SVC_MODULE} [PrereqResolver] Available Sheet1 syllabi for matching: ${allSyllabusDefinitionsFromSheet1
        .map(
          (s) => `ID: ${s.id}, PQSVerRef: "${s.pqsVersionRef}", Lvl: ${s.level}`
        )
        .join("; ")}`
    );
    return null;
  }
  loggingService.logDebug(
    `${SVC_MODULE} [PrereqResolver] Found parent syllabus for prereq: ID="${parentSyllabusForPrereq.id}"`
  );

  // Attempt to find the requirement within the found parent syllabus's requirements list
  // by matching the cleaned itemDescriptionFromFile against Requirement.name (which is SHARP Description)
  // This assumes requirement.name in allParsedRequirementsMap is the full SHARP Description
  for (const req of parentSyllabusForPrereq.requirements) {
    // The itemDescriptionFromFile is usually a shorter version of the full SHARP Description.
    // We need a robust way to match. Let's try if req.name (full SHARP desc) CONTAINS itemDescriptionFromFile.
    // Also check displayName as "Short Name" might be used in prereq string's item description part.
    const reqNameUpper = req.name.toUpperCase();
    const itemDescUpper = itemDescriptionFromFile.toUpperCase();
    const reqDisplayNameUpper = req.displayName.toUpperCase();

    if (
      reqNameUpper.includes(itemDescUpper) ||
      reqDisplayNameUpper.includes(itemDescUpper) ||
      itemDescUpper.includes(reqDisplayNameUpper)
    ) {
      // Additional check to ensure we are not too loose, e.g., by comparing module numbers if present
      // For now, this containment check might be a good start.
      loggingService.logInfo(
        `${SVC_MODULE} [PrereqResolver] MATCHED! PrereqStr: "${originalPrereqStr}" -> Req ID: "${req.id}" (Name: "${req.name}", MatchedPart: "${itemDescriptionFromFile}")`
      );
      return req.id;
    }
  }

  loggingService.logWarn(
    `${SVC_MODULE} [PrereqResolver] FAILED to find requirement matching "${itemDescriptionFromFile}" in syllabus "${parentSyllabusForPrereq.id}" for prereq string "${originalPrereqStr}".`
  );
  return null;
}

export const excelSyllabusProcessorService = {
  async parseSharpSyllabusExport(file: File): Promise<Syllabus[]> {
    loggingService.logInfo(
      `${SVC_MODULE} Initiating SHARP Syllabus Export parsing: "${file.name}"`
    );
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const parsedSyllabi: Syllabus[] = [];
    const allParsedRequirementsMap = new Map<string, Requirement>();
    const rawPrerequisitesData = new Map<string, string>();

    // --- Step 1: Parse "Sheet 1: Syllabus and Stages" ---
    const sheet1Name = "Syllabus and Stages";
    const sheet1 = workbook.Sheets[sheet1Name];
    if (!sheet1)
      throw new Error(
        `${SVC_MODULE} Sheet 1 "${sheet1Name}" not found. Available: ${workbook.SheetNames.join(
          ", "
        )}`
      );
    loggingService.logDebug(`${SVC_MODULE} Found Sheet 1: "${sheet1Name}".`);
    const sheet1Data = XLSX.utils.sheet_to_json<any[]>(sheet1, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    if (sheet1Data.length < 4)
      throw new Error(`${SVC_MODULE} Sheet 1 has < 4 rows for master info.`);
    const masterRowData = sheet1Data[3]; // Excel Row 4
    if (!masterRowData || masterRowData.length < 6)
      throw new Error(
        `${SVC_MODULE} Master syllabus row (Excel Row 4) in Sheet 1 incomplete.`
      );

    const masterSyllabusIdentifierFromA4 = masterRowData[0] as string | null;
    const masterSyllabusFullTitleFromC4 = masterRowData[2] as string | null;
    const versionFromF4Cell = masterRowData[5];

    if (!masterSyllabusIdentifierFromA4?.trim())
      throw new Error(`${SVC_MODULE} Master Syllabus ID (A4) missing.`);
    if (!String(versionFromF4Cell)?.trim())
      throw new Error(`${SVC_MODULE} Syllabus Version (F4) missing.`);

    let versionString = String(versionFromF4Cell).trim();
    if (/^\d+$/.test(versionString) && !versionString.includes(".")) {
      versionString = `${versionString}.0`;
    }

    const {
      year: parsedMasterYear,
      position: parsedMasterPosition,
      baseName: parsedMasterBaseName,
      originalIdentifier: masterOriginalA4,
    } = parseMasterSyllabusIdentifier(masterSyllabusIdentifierFromA4);
    const pqsVersionRefForLinking = `${masterOriginalA4} ${versionString}`;
    loggingService.logInfo(
      `${SVC_MODULE} Master Doc: A4="${masterSyllabusIdentifierFromA4}", F4Ver(norm)="${versionString}", PQSVerRef="${pqsVersionRefForLinking}"`
    );

    for (
      let excelRowNumber = 5;
      excelRowNumber <= sheet1Data.length;
      excelRowNumber++
    ) {
      const levelRow = sheet1Data[excelRowNumber - 1];
      if (!levelRow || !levelRow[0]?.trim()) {
        loggingService.logInfo(
          `${SVC_MODULE} End of level defs at Excel row ${excelRowNumber}.`
        );
        break;
      }

      const levelStringFromA = String(levelRow[0]).trim();
      const levelSpecificTitleFromC = String(
        levelRow[2] || `Level specific title for ${levelStringFromA}`
      ).trim();
      const levelMatch = levelStringFromA.match(/\b(100|200|300|400|500)\b/);
      if (!levelMatch?.[0]) {
        loggingService.logWarn(
          `${SVC_MODULE} No ACTC Level in A${excelRowNumber}: "${levelStringFromA}". Skip.`
        );
        continue;
      }
      const level = parseInt(levelMatch[0]);

      const syllabusId =
        `${parsedMasterPosition}_${parsedMasterYear}_L${level}_${parsedMasterBaseName}`.toUpperCase();
      if (parsedSyllabi.find((s) => s.id === syllabusId)) {
        loggingService.logWarn(
          `${SVC_MODULE} Duplicate syllabus ID ${syllabusId}. Skip.`
        );
        continue;
      }

      parsedSyllabi.push({
        id: syllabusId,
        name: levelSpecificTitleFromC,
        masterSyllabusIdentifier: masterOriginalA4,
        position: parsedMasterPosition,
        level: level,
        year: parsedMasterYear,
        pqsVersionRef: pqsVersionRefForLinking,
        requirements: [],
        wingGoalMonths: 12,
        squadronGoalMonths: 9,
        goalStartMonthsOffset: 0,
        displayName: "",
      });
      loggingService.logInfo(
        `${SVC_MODULE} Created Syllabus (Sheet1): ID=${syllabusId}, Lvl=${level}, PQSVerRef="${pqsVersionRefForLinking}"`
      );
    }
    loggingService.logInfo(
      `${SVC_MODULE} Sheet 1: ${parsedSyllabi.length} syllabi instances defined.`
    );
    if (parsedSyllabi.length === 0) {
      loggingService.logError(`${SVC_MODULE} No syllabi from Sheet 1.`);
      return [];
    }

    // --- Step 2: Parse "Sheet 3: Syllabus Events" ---
    const sheet3Name = "Syllabus Events";
    const sheet3 = workbook.Sheets[sheet3Name];
    if (!sheet3)
      throw new Error(`${SVC_MODULE} Sheet 3 "${sheet3Name}" not found.`);

    const sheet3AllRows = XLSX.utils.sheet_to_json<any[]>(sheet3, {
      header: 1,
      defval: null,
      blankrows: false,
    });
    const headerRowIndexInArray_S3 = 1;
    if (sheet3AllRows.length < headerRowIndexInArray_S3 + 1)
      throw new Error(`${SVC_MODULE} Sheet 3 too short for headers.`);
    const sheet3Headers = sheet3AllRows[headerRowIndexInArray_S3] as string[];
    if (!sheet3Headers?.length)
      throw new Error(`${SVC_MODULE} Sheet 3 header row empty.`);

    const s3HeaderMap = sheet3Headers.reduce((acc, h, i) => {
      if (h) acc[String(h).trim().toUpperCase()] = i;
      return acc;
    }, {} as { [k: string]: number });
    loggingService.logDebug(`${SVC_MODULE} Sheet 3 Header Map:`, s3HeaderMap);

    const HDR_EVENT_SUBTYPE = "EVENT SUBTYPE";
    const HDR_SHORT_NAME = "SHORT NAME";
    const HDR_PARENT_LEVEL = "PARENT";
    const HDR_DESCRIPTION = "DESCRIPTION";
    const HDR_REQUIRED = "REQUIRED";
    const HDR_PREREQUISITES = "PREREQUISITES";

    [HDR_PARENT_LEVEL, HDR_DESCRIPTION, HDR_EVENT_SUBTYPE].forEach((h) => {
      // Required and Prereqs can be blank
      if (s3HeaderMap[h] === undefined)
        throw new Error(
          `${SVC_MODULE} Missing critical header "${h}" in Sheet 3.`
        );
    });

    for (
      let idx_S3 = headerRowIndexInArray_S3 + 1;
      idx_S3 < sheet3AllRows.length;
      idx_S3++
    ) {
      const row = sheet3AllRows[idx_S3];
      const excelRowNum = idx_S3 + 1;
      const description = String(
        row[s3HeaderMap[HDR_DESCRIPTION]] || ""
      ).trim();
      if (!description) {
        loggingService.logDebug(
          `${SVC_MODULE} Skip Sheet3 Row ${excelRowNum}: No Description.`
        );
        continue;
      }

      const parentLevelStr = String(
        row[s3HeaderMap[HDR_PARENT_LEVEL]] || ""
      ).trim();
      const levelMatch = parentLevelStr.match(/\b(100|200|300|400|500)\b/);
      if (!levelMatch?.[0]) {
        loggingService.logWarn(
          `${SVC_MODULE} Req "${description}" (Row ${excelRowNum}): Invalid Parent Level "${parentLevelStr}". Skip.`
        );
        continue;
      }
      const actcLevel = parseInt(levelMatch[0]);

      const parentSyllabusForReq = parsedSyllabi.find(
        (s) =>
          s.level === actcLevel &&
          s.position === parsedMasterPosition &&
          s.year === parsedMasterYear
      );
      if (!parentSyllabusForReq) {
        loggingService.logWarn(
          `${SVC_MODULE} Req "${description}" (Row ${excelRowNum}): No parent syllabus (Lvl ${actcLevel}, Pos ${parsedMasterPosition}, Yr ${parsedMasterYear}). Orphaned.`
        );
        continue;
      }

      const shortName = String(
        row[s3HeaderMap[HDR_SHORT_NAME]] || description
      ).trim();
      const eventSubtype = String(
        row[s3HeaderMap[HDR_EVENT_SUBTYPE]] || ""
      ).trim();
      const requiredStatus = String(
        row[s3HeaderMap[HDR_REQUIRED]] || ""
      ).trim();
      const prerequisitesBlob = row[s3HeaderMap[HDR_PREREQUISITES]] as
        | string
        | null;

      const { type: reqType, isWaived: derivedWaived } =
        mapSharpEventSubtype(eventSubtype);
      const isMandatory = requiredStatus.toUpperCase() === "X";
      const reqId = generateRequirementId(parentSyllabusForReq.id, description);

      if (allParsedRequirementsMap.has(reqId)) {
        loggingService.logWarn(
          `${SVC_MODULE} Duplicate Req ID ${reqId} for "${description}". Skip.`
        );
        continue;
      }

      const newReq: Requirement = {
        id: reqId,
        name: description,
        displayName: shortName,
        requirementType: reqType,
        rawSharpEventSubtype: eventSubtype || undefined,
        prerequisites: [],
        isMandatory: isMandatory,
        isDefaultWaived: derivedWaived || !isMandatory,
      };
      allParsedRequirementsMap.set(reqId, newReq);
      parentSyllabusForReq.requirements.push(newReq);
      if (prerequisitesBlob) rawPrerequisitesData.set(reqId, prerequisitesBlob);
    }
    loggingService.logInfo(
      `${SVC_MODULE} Sheet 3: ${allParsedRequirementsMap.size} reqs parsed & added to syllabi.`
    );

    // --- Step 3: Resolve Prerequisite Strings to IDs ---
    loggingService.logInfo(
      `${SVC_MODULE} Starting Prerequisite Resolution (${allParsedRequirementsMap.size} total reqs)...`
    );
    for (const [reqId, requirement] of allParsedRequirementsMap.entries()) {
      const prereqBlob = rawPrerequisitesData.get(reqId);
      if (prereqBlob) {
        const individualPrereqStrings = prereqBlob
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const prereqStr of individualPrereqStrings) {
          const resolvedPrereqId = resolvePrerequisiteStringToId(
            prereqStr,
            parsedSyllabi,
            allParsedRequirementsMap
          );
          if (
            resolvedPrereqId &&
            resolvedPrereqId !== reqId &&
            !requirement.prerequisites.includes(resolvedPrereqId)
          ) {
            requirement.prerequisites.push(resolvedPrereqId);
          }
        }
      }
    }
    loggingService.logInfo(`${SVC_MODULE} Prerequisite resolution complete.`);

    loggingService.logInfo(
      `${SVC_MODULE} SHARP Syllabus Export parsing fully complete. Returning ${parsedSyllabi.length} syllabi.`
    );
    parsedSyllabi.forEach((s) =>
      loggingService.logDebug(
        `${SVC_MODULE} Final Syllabus ID: ${s.id} has ${s.requirements.length} requirements.`
      )
    );
    return parsedSyllabi;
  },
};
