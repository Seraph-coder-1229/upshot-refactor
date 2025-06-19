// src/utils/anonymizer.ts

import type { Upgrader } from "@/types/personnelTypes";
import { deepClone } from "./dataUtils";

/**
 * Defines the structure for the object returned by the anonymization process.
 * @property anonymizedPersonnel - A list of upgraders with their names replaced by pseudonyms.
 * @property keyMap - A map to convert pseudonyms back to real names. The key is the pseudonym, the value is the real name.
 */
export interface AnonymizationResult {
  anonymizedPersonnel: Upgrader[];
  keyMap: Map<string, string>;
}

/**
 * Anonymizes personnel data by replacing display names with generic pseudonyms.
 * It creates a deep copy of the personnel data to avoid mutating the original state.
 *
 * @param personnel - An array of Upgrader objects to be anonymized.
 * @returns An AnonymizationResult object containing the anonymized data and a keyMap for de-anonymization.
 */
export function anonymizeData(personnel: Upgrader[]): AnonymizationResult {
  const keyMap = new Map<string, string>();

  const anonymizedPersonnel = personnel.map((person, index) => {
    const pseudonym = `Student ${index + 1}`;

    // Store the mapping to reverse the process later
    keyMap.set(person.displayName, person.displayName);

    // Create a deep copy to avoid changing the original object in the store
    const anonymizedPerson = deepClone(person);
    anonymizedPerson.displayName = person.displayName;

    return anonymizedPerson;
  });

  return { anonymizedPersonnel, keyMap };
}

/**
 * Replaces pseudonyms in a given text with their original names using a keyMap.
 *
 * @param text - The text content (e.g., an AI-generated report) containing pseudonyms.
 * @param keyMap - A map where keys are pseudonyms and values are the real names.
 * @returns The text with all pseudonyms replaced by their original names.
 */
export function deAnonymizeText(
  text: string,
  keyMap: Map<string, string>
): string {
  let deAnonymizedText = text;

  // Iterate over the map and replace all occurrences of the pseudonym (key) with the real name (value)
  keyMap.forEach((realName, pseudonym) => {
    // Use a regular expression with the 'g' flag to ensure all instances are replaced
    const regex = new RegExp(pseudonym, "g");
    deAnonymizedText = deAnonymizedText.replace(regex, realName);
  });

  return deAnonymizedText;
}
