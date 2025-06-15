// src/utils/colorUtils.ts
import tinycolor from "tinycolor2";

/**
 * Calculates a darker shade for a hover effect.
 * @param color - The base color in hex format.
 * @returns A new hex color string for the hover state.
 */
export function calculateHoverColor(color: string): string {
  return tinycolor(color).darken(10).toHexString();
}

/**
 * Calculates the best foreground color (black or white) for a given background color
 * to meet accessibility contrast standards.
 * @param color - The background color in hex format.
 * @returns '#ffffff' (white) or '#000000' (black).
 */
export function calculateForegroundColor(color: string): string {
  return tinycolor.isReadable(color, "#000", { level: "AA", size: "small" })
    ? "#000000"
    : "#ffffff";
}
