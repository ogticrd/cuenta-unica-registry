/**
 * Unwraps the JSON body of a fetch response.
 * Throws an error if the response is not ok.
 */
export const unwrap = async (r: Response) => {
  if (!r.ok) {
    const error = await r.json().catch(() => ({}));
    throw new Error(error.error_description || error.error || r.statusText);
  }
  return r.json();
};
