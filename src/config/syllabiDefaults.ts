import {
  type Syllabus,
  type Requirement,
  RequirementType, // Import the enum itself
} from "../types/syllabiTypes";

// Example of a very basic default PQS requirement
const examplePqsRequirement: Requirement = {
  id: "DEFAULT_PQS_001",
  name: "Basic Safety Procedures (Default)",
  displayName: "Basic Safety (D)",
  // CORRECTED: Use the 'type' property and the RequirementType enum
  type: RequirementType.PQS,
  level: 200,
  prerequisites: [],
  isDefaultWaived: false,
};

// Example of a very basic default Event requirement
const exampleEventRequirement: Requirement = {
  id: "DEFAULT_EVT_001",
  name: "Introductory Flight Simulation (Default)",
  displayName: "Intro Sim (D)",
  // CORRECTED: Use the 'type' property and the RequirementType enum
  type: RequirementType.Event,
  level: 200,
  prerequisites: ["Basic Safety Procedures (Default)"], // Depends on the PQS above
  isDefaultWaived: false,
};

// Define a default syllabus structure
const exampleDefaultSyllabus: Syllabus = {
  id: "DEFAULT_PILOT_202X",
  name: "Default Pilot Syllabus (Example)",
  displayName: "Default Pilot 202X",
  position: "PILOT",
  year: "202X", // Placeholder year
  // CORRECTED: Use 'baseLevel' instead of 'level' for the syllabus
  baseLevel: 200,
  requirements: [examplePqsRequirement, exampleEventRequirement],
  masterSyllabusIdentifier: null,
};

// Export the default syllabi array
export const DEFAULT_SYLLABI: Syllabus[] = [exampleDefaultSyllabus];
