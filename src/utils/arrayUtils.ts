/**
 * Returns a new array containing only the unique values from the input array.
 * @param array The array to process.
 * @returns A new array with unique values.
 */
export function getUniqueValues<T>(array: T[]): T[] {
  if (!array) {
    return [];
  }
  return [...new Set(array)];
}
