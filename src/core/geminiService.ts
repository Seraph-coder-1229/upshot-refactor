// src/core/geminiService.ts

import { loggingService } from "@/utils/loggingService";

const SVC_MODULE = "[GeminiService]";
const API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

/**
 * Calls the Google Gemini API with a given prompt.
 *
 * @param prompt - The full text prompt to send to the AI model.
 * @param apiKey - The user's Gemini API key.
 * @returns A promise that resolves to the text content of the AI's response.
 * @throws An error if the API call fails or returns an error.
 */
export async function callGeminiApi(
  prompt: string,
  apiKey: string
): Promise<string> {
  const fullApiEndpoint = `${API_ENDPOINT}?key=${apiKey}`;

  loggingService.logInfo(`${SVC_MODULE} Calling Gemini API.`);

  try {
    const response = await fetch(fullApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      loggingService.logError(
        `${SVC_MODULE} API call failed with status: ${response.status}`,
        errorBody
      );
      throw new Error(
        `Gemini API request failed: ${
          errorBody.error?.message || response.statusText
        }`
      );
    }

    const responseData = await response.json();
    const textContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      loggingService.logWarn(
        `${SVC_MODULE} API response did not contain valid text content.`,
        responseData
      );
      throw new Error(
        "Received an invalid or empty response from the Gemini API."
      );
    }

    loggingService.logInfo(
      `${SVC_MODULE} Successfully received response from Gemini API.`
    );
    return textContent;
  } catch (error) {
    loggingService.logError(
      `${SVC_MODULE} An error occurred during the Gemini API call.`,
      error
    );
    // Re-throw the error so the UI layer can catch it and notify the user
    throw error;
  }
}
