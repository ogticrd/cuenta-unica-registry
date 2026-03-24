/**
 * Validates that a return URL is a well-formed absolute HTTP(S) URL.
 * Rejects javascript:, data:, relative paths, and malformed URLs.
 */
export function isValidReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
