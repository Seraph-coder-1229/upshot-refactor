import { loggingService } from "./loggingService"; // For logging warnings if SubtleCrypto isn't available

/**
 * Asynchronously generates a SHA-256 hash of a given string.
 * Uses the browser's built-in SubtleCrypto API.
 * @param message The string to hash.
 * @returns A Promise that resolves to the hex-encoded SHA-256 hash string,
 * or an error string if SubtleCrypto is unavailable or an error occurs.
 */
export async function generateSha256Hash(message: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // Convert bytes to hex string
      return hashHex;
    } catch (error) {
      loggingService.logError(
        "Error generating SHA-256 hash using SubtleCrypto:",
        error
      );
      // Fallback or error representation if hashing fails critically
      return `error_hashing_${message.substring(0, 10)}`;
    }
  } else {
    // Fallback for environments without SubtleCrypto (e.g., very old browser, or Node.js without 'crypto' module in a web context)
    // This is a very basic and insecure placeholder if SubtleCrypto is not available.
    // For a production client-side app, you'd expect SubtleCrypto to be there.
    const warningMessage =
      "SubtleCrypto API not available. Cannot generate secure SHA-256 hash client-side. Using insecure placeholder.";
    loggingService.logWarn(warningMessage);
    // THIS IS A VERY BASIC AND INSECURE FALLBACK - In a real app, you might throw an error
    // or use a polyfill if older browser support is critical and hashing is mandatory.
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `insecure_hash_placeholder_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Creates a consistent, anonymized ID for an upgrader.
 * For now, prepends UG- to the SHA-256 hash of their original ID.
 * @param upgraderOriginalId The original unique identifier for the upgrader (e.g., SHARP Name).
 * @returns A Promise that resolves to the anonymized ID string.
 */
export async function getAnonymizedUpgraderId(
  upgraderOriginalId: string
): Promise<string> {
  if (
    !upgraderOriginalId ||
    typeof upgraderOriginalId !== "string" ||
    upgraderOriginalId.trim() === ""
  ) {
    loggingService.logWarn(
      "Attempted to anonymize an empty or invalid upgrader ID."
    );
    return "ANON_ID_INVALID_INPUT";
  }
  const hashedId = await generateSha256Hash(upgraderOriginalId);
  return `UG-${hashedId.substring(0, 16)}`; // Using a portion of the hash for brevity if desired
}
