const EMAIL = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi;
const CEDULA = /\b\d{3}-?\d{7}-?\d\b/g;
const UUID = /\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

export function sanitizeLogText(value: string, limit = 500) {
  return value
    .replace(/https?:\/\/[^\s)"']+/gi, (url) => {
      const location = url.match(
        /\/([A-Za-z0-9_.-]+\.(?:js|mjs|cjs|ts|tsx))(:\d{1,7}:\d{1,7})$/,
      );
      return location ? `[source]/${location[1]}${location[2]}` : "[url]";
    })
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(JWT, "[token]")
    .replace(EMAIL, "[email]")
    .replace(CEDULA, "[cedula]")
    .replace(UUID, "[id]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[ip]")
    .replace(
      /\b(password|authorization|cookie|token|secret|api[-_]?key)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1=[redacted]",
    )
    .slice(0, limit);
}

export function sanitizeLogRoute(value: string) {
  return sanitizeLogText(value.split(/[?#]/)[0], 200);
}

export function getSafeErrorName(error: unknown) {
  if (!(error instanceof Error)) return "UnknownError";
  return /^[a-z][a-z0-9_.-]{0,63}$/i.test(error.name)
    ? error.name
    : "UnknownError";
}

export function getSafeStack(error: unknown) {
  if (!(error instanceof Error) || !error.stack) return undefined;
  const frames = error.stack
    .split("\n")
    .map((line) =>
      line.replace(/^([^@\n]+)@(https?:\/\/.+)$/, "    at $1 ($2)"),
    )
    .filter((line) => /^\s*at\s/.test(line))
    .slice(0, 15)
    .map((line) => sanitizeLogText(line, 300));
  return frames.length ? frames.join("\n") : undefined;
}
