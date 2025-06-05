import {
  type Syllabus,
  type Requirement,
  type RequirementTypeInternal,
} from "../types/syllabiTypes";

// Example of a very basic default PQS requirement
const examplePqsRequirement: Requirement = {
  id: "DEFAULT_PQS_001", // Ensure IDs are unique if you have multiple defaults
  name: "Basic Safety Procedures (Default)", // Corresponds to SHARP 'Description'
  displayName: "Basic Safety (D)", // Corresponds to SHARP 'Short Name'
  requirementType: "PQS" as RequirementTypeInternal,
  rawSharpEventSubtype: "Fundamental", // Example original subtype
  prerequisites: [],
  isMandatory: true,
  isDefaultWaived: false,
};

// Example of a very basic default Event requirement
const exampleEventRequirement: Requirement = {
  id: "DEFAULT_EVT_001",
  name: "Introductory Flight Simulation (Default)",
  displayName: "Intro Sim (D)",
  requirementType: "Event" as RequirementTypeInternal,
  rawSharpEventSubtype: "OFT",
  prerequisites: ["DEFAULT_PQS_001"], // Depends on the PQS above
  isMandatory: true,
  isDefaultWaived: false,
};

// Define a default syllabus structure
const exampleDefaultSyllabus: Syllabus = {
  id: "DEFAULT_PILOT_L200_202X", // Unique ID for this syllabus
  displayName: "Default Pilot ACTC 200",
  name: "Default Pilot Level 200 Syllabus (Example)", // Corresponds to SHARP Sheet 1 "Syllabus Name"
  position: "PILOT",
  level: 200,
  year: "202X", // Placeholder year
  pqsVersionRef: "Default PQS v1.0", // Example PQS Version
  requirements: [examplePqsRequirement, exampleEventRequirement],
  wingGoalMonths: 12,
  squadronGoalMonths: 9,
  goalStartMonthsOffset: 0,
  masterSyllabusIdentifier: null,
};

// Export the default syllabi array
// For a production app relying on SHARP import, this might be an empty array.
// For development and testing, having one example can be useful.
export const defaultSyllabi: Syllabus[] = [
  exampleDefaultSyllabus,
  // You could add more default syllabus objects here if desired
  // Or keep it empty:
  // export const defaultSyllabi: Syllabus[] = [];
];
