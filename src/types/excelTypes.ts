// Represents a processed row from a SHARP data sheet before full mapping
export interface SharpSheetRow {
  studentIdentifier: string; // Name from student column in SHARP (e.g., "LAST, FIRST M")
  pqsVersion?: string | null; // From "PQS VER" column

  // Status/Date for overall ACTC levels from the "ACTC Lvl" columns
  // Key is the level (200, 300, 400)
  // Value is the cell content from ONE of the SHARP sheets (e.g., date from "Date Received", or string from "Status")
  // The excelProcessor will need to combine these from all 4 sheets for the Upgrader.actcLevelData
  actcLevelCells: {
    [level: number]: {
      dateReceivedCell?: string | number | null; // Raw cell value
      instructorCell?: string | null;
      gradeCell?: string | number | null;
      statusCell?: string | null; // Raw status code/abbreviation
    };
  };

  // Key: Event/PQS Name (column header from SHARP)
  // Value: Contains the raw cell values from EACH of the 4 sheets for that event
  eventItemCells: {
    [eventName: string]: {
      dateReceivedCell?: string | number | null; // Raw cell value (could be Excel date number or string)
      instructorCell?: string | null;
      gradeCell?: string | number | null;
      statusCell?: string | null; // Raw status code/abbreviation
    };
  };
}

// For the status sheet legend (Row 4)
// Key: Column Index or Event Name. Value: Map of status code to full description
export interface StatusLegend {
  [eventColumnIdentifier: string]: {
    [statusCode: string]: string; // e.g., "PSO": "Pass - Signed Off"
  };
}
