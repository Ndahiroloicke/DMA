/**
 * API SERVICE — Free Dictionary API integration
 * -------------------------------------------
 * This file is the ONLY place where we talk to the external dictionary API.
 * All screens import `searchWord()` from here instead of calling axios directly.
 *
 * API endpoint (Activity 1 requirement):
 *   GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 *
 * Example successful JSON shape (simplified):
 * [
 *   {
 *     "word": "hello",
 *     "phonetics": [
 *       { "text": "/həˈləʊ/", "audio": "https://.../hello-uk.mp3" }
 *     ],
 *     "meanings": [
 *       {
 *         "partOfSpeech": "noun",
 *         "definitions": [
 *           { "definition": "...", "example": "...", "synonyms": [...] }
 *         ],
 *         "synonyms": [...],
 *         "antonyms": [...]
 *       }
 *     ],
 *     "sourceUrls": ["https://en.wiktionary.org/..."]
 *   }
 * ]
 *
 * WordDetailScreen reads this array and renders each field on screen.
 */

import axios from 'axios';

/** Base URL for English dictionary entries — {word} is appended at the end. */
const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Reusable axios instance (Activity 1 — axios library requirement).
 * - baseURL: so we only pass "/hello" instead of the full URL each time
 * - timeout: 10 seconds — if the server is slow, axios throws and SearchScreen shows an error
 * - headers: tells the API we expect JSON back
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * searchWord — main function used by SearchScreen and WordDetailScreen.
 *
 * Flow:
 *   1. Clean the input (trim spaces, lowercase for consistent URLs)
 *   2. Build final URL: BASE_URL + "/" + word  (encodeURIComponent handles spaces/special chars)
 *   3. Send HTTP GET via axios
 *   4. Return response.data (parsed JSON array) to the caller
 *
 * Errors are NOT handled here — they bubble up to the screen's try/catch:
 *   - 404  → word not found
 *   - timeout / network → no connection
 *
 * @param {string} word — the English word typed by the user
 * @returns {Promise<Array>} — API response array stored temporarily in screen state
 */
export const searchWord = async (word) => {
  const trimmedWord = word.trim().toLowerCase();

  // GET /api/v2/entries/en/{word}  — matches exam Activity 1 step 5
  const response = await apiClient.get(`/${encodeURIComponent(trimmedWord)}`);

  // axios automatically parses JSON; we pass the array to navigation / state
  return response.data;
};
