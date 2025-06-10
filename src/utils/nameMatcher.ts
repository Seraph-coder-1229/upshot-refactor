import { type Upgrader } from "../types/personnelTypes";

function normalize(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  let m = 0;
  if (s1.length === 0 || s2.length === 0) return 0;
  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(i + range + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }
  if (m === 0) return 0;
  let t = 0,
    k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }
  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  if (jaro < 0.7) return jaro;
  let l = 0;
  const len = Math.min(s1.length, s2.length, 4);
  for (let i = 0; i < len; i++) if (s1[i] === s2[i]) l++;
  return jaro + l * p * (1 - jaro);
}

export function createPersonnelNameMatcher(personnel: Upgrader[]) {
  const normalizedToSharpNameMap = new Map<string, string>();
  for (const p of personnel) {
    const normalized = normalize(p.name);
    if (!normalizedToSharpNameMap.has(normalized)) {
      normalizedToSharpNameMap.set(normalized, p.name);
    }
  }

  const findMatch = (
    nameToFind: string,
    positionKey: string | null
  ): string | null => {
    const normalizedNameToFind = normalize(nameToFind);
    if (!normalizedNameToFind || !positionKey) return null;

    let baseSharpName: string | null = null;
    if (normalizedToSharpNameMap.has(normalizedNameToFind)) {
      baseSharpName = normalizedToSharpNameMap.get(normalizedNameToFind)!;
    } else {
      let bestMatch = { name: null as string | null, score: 0.0 };
      for (const [norm, sharpName] of normalizedToSharpNameMap.entries()) {
        const score = jaroWinkler(normalizedNameToFind, norm);
        if (score > bestMatch.score) {
          bestMatch = { name: sharpName, score: score };
        }
      }
      if (bestMatch.score > 0.92) {
        baseSharpName = bestMatch.name;
      }
    }

    if (baseSharpName) {
      return `${baseSharpName}-${positionKey}`;
    }

    return null;
  };

  return { findMatch };
}
