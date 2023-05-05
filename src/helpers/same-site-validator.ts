import { IncomingHttpHeaders } from "node:http";

export function validateSameSiteRequest(headers: IncomingHttpHeaders) {
  const fetchHeaderKey = "sec-fetch-site";
  const fetchHeaderValue = "same-origin";

  return (
    headers[fetchHeaderKey] && headers[fetchHeaderKey] === fetchHeaderValue
  );
}
