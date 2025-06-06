import { type Upgrader } from "../types/personnelTypes";

// --- Internal Helper Types ---

interface NameComponents {
  id: string;
  lastName: string;
  firstName?: string;
  middleInitial?: string;
  rank?: string;
  normalizedCanon: string;
}

// --- Internal Helper Functions ---

/**
 * Normalizes a name by converting to uppercase and removing non-alphanumeric chars.
 */
function normalize(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Parses a canonical "LAST, FIRST M" name into its components.
 */
function parseSharpName(upgrader: Upgrader): NameComponents {
  const [lastName, rest] = upgrader.name.split(",", 2).map((s) => s.trim());
  const [firstName, middleInitial] = rest?.split(" ") || [];

  return {
    id: upgrader.id,
    lastName,
    firstName,
    middleInitial,
    rank: upgrader.rank?.toUpperCase(),
    normalizedCanon: normalize(upgrader.name),
  };
}

// --- Jaro-Winkler Implementation for Layer 3 ---

function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  // ... [Implementation of Jaro-Winkler algorithm] ...
  // (A full implementation is included below)
  let m = 0;
  const s1_len = s1.length;
  const s2_len = s2.length;
  if (s1_len === 0 || s2_len === 0) return 0;

  const match_distance = Math.floor(Math.max(s1_len, s2_len) / 2) - 1;
  const s1_matches = new Array(s1_len).fill(false);
  const s2_matches = new Array(s2_len).fill(false);

  for (let i = 0; i < s1_len; i++) {
    const start = Math.max(0, i - match_distance);
    const end = Math.min(i + match_distance + 1, s2_len);
    for (let j = start; j < end; j++) {
      if (s2_matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1_matches[i] = true;
      s2_matches[j] = true;
      m++;
      break;
    }
  }

  if (m === 0) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < s1_len; i++) {
    if (!s1_matches[i]) continue;
    while (!s2_matches[k]) k++;
    if (s1[i] !== s2[k]) t++;
    k++;
  }
  t /= 2;

  const jaro = (m / s1_len + m / s2_len + (m - t) / m) / 3;
  if (jaro < 0.7) return jaro;

  let l = 0;
  const len = Math.min(s1_len, s2_len, 4);
  for (let i = 0; i < len; i++) {
    if (s1[i] === s2[i]) l++;
  }
  return jaro + l * p * (1 - jaro);
}

// --- The Public API ---

/**
 * Creates a personnel name matcher object.
 * @param personnel - The array of Upgrader objects from the personnel store.
 * @returns An object with a findMatch method.
 */
export function createPersonnelNameMatcher(personnel: Upgrader[]) {
  // --- Preparation Phase ---
  const allComponents = personnel.map(parseSharpName);
  const exactMatchMap = new Map(
    allComponents.map((c) => [c.normalizedCanon, c.id])
  );

  /**
   * Tries to find the best match for a given name from a SHARP file.
   * @param nameToFind - The raw name string from the SHARP data.
   * @returns The matching Upgrader ID, or null if no confident match is found.
   */
  const findMatch = (nameToFind: string): string | null => {
    const normalizedNameToFind = normalize(nameToFind);
    if (!normalizedNameToFind) return null;

    // --- Layer 1: Exact Match ---
    if (exactMatchMap.has(normalizedNameToFind)) {
      return exactMatchMap.get(normalizedNameToFind)!;
    }

    // --- Layer 2: Component Search ---
    const cleanedNameToFind = nameToFind.toUpperCase().replace(/[.,]/g, "");
    const candidates = allComponents.filter((c) =>
      cleanedNameToFind.includes(c.lastName)
    );

    if (candidates.length > 0) {
      if (candidates.length === 1) {
        return candidates[0].id; // Confident match on unique last name
      } else {
        // Score candidates to find the best one
        const scoredCandidates = candidates
          .map((c) => {
            let score = 0;
            if (c.firstName && cleanedNameToFind.includes(c.firstName))
              score += 2;
            if (c.rank && cleanedNameToFind.includes(c.rank)) score += 1;
            if (c.middleInitial && cleanedNameToFind.includes(c.middleInitial))
              score += 1;
            return { id: c.id, score };
          })
          .filter((c) => c.score > 0);

        if (scoredCandidates.length > 0) {
          scoredCandidates.sort((a, b) => b.score - a.score);
          // Ensure the top score is unique to avoid ambiguity
          if (
            scoredCandidates.length === 1 ||
            scoredCandidates[0].score > scoredCandidates[1].score
          ) {
            return scoredCandidates[0].id;
          }
        }
      }
    }

    // --- Layer 3: Fuzzy Match ---
    let bestFuzzyMatch = { id: null as string | null, score: 0.0 };
    for (const comp of allComponents) {
      const score = jaroWinkler(normalizedNameToFind, comp.normalizedCanon);
      if (score > bestFuzzyMatch.score) {
        bestFuzzyMatch = { id: comp.id, score };
      }
    }
    // Use a high threshold for fuzzy matching to ensure confidence
    if (bestFuzzyMatch.score > 0.92) {
      return bestFuzzyMatch.id;
    }

    return null; // No confident match found
  };

  return { findMatch };
}
