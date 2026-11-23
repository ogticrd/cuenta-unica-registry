import "server-only";

import { createHmac } from "node:crypto";
import pino, { type LevelWithSilent } from "pino";
import { name, version } from "@/package.json";
import { getRequestLogContext } from "./context";
import {
  getSafeErrorName,
  getSafeStack,
  sanitizeLogRoute,
  sanitizeLogText,
} from "./sanitize";

const severities = {
  trace: "DEBUG",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
  fatal: "CRITICAL",
} as const;

function getLogLevel(): LevelWithSilent {
  const configured = process.env.LOG_LEVEL;
  if (
    configured &&
    (configured === "silent" || Object.hasOwn(severities, configured))
  ) {
    return configured as LevelWithSilent;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const pinoLogger = pino(
  {
    level: getLogLevel(),
    messageKey: "message",
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({
        severity: severities[label as keyof typeof severities],
      }),
    },
    redact: {
      paths: [
        "password",
        "*.password",
        "token",
        "*.token",
        "authorization",
        "headers.authorization",
        "cookie",
        "headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  },
  process.stdout,
);

export interface LogContext {
  operation: string;
  event?: string;
  origin?: "server" | "browser";
  source?: string;
  form?: string;
  stage?: string;
  code?: string;
  route?: string;
  method?: string;
  status?: number;
  upstreamStatus?: number;
  errorType?: string;
  errorId?: string;
  reason?: string;
  digest?: string;
  messageIds?: number[];
  confidence?: number;
  similarity?: number;
  threshold?: number;
  attemptNumber?: number;
  retryAfterSeconds?: number;
  detectorState?: string;
  flowId?: string;
  sessionId?: string;
  identityId?: string;
  hasContact?: boolean;
  commentLength?: number;
}

function logReference(value?: string) {
  const secret = process.env.REGISTRATION_SESSION_SECRET;
  return value && secret
    ? createHmac("sha256", secret)
        .update(`observability:v1:${value}`)
        .digest("hex")
        .slice(0, 24)
    : undefined;
}

function finite(value: number | undefined) {
  return Number.isFinite(value) ? value : undefined;
}

function safe(value: string | undefined) {
  return value === undefined ? undefined : sanitizeLogText(value);
}

function writeLog(
  level: Exclude<keyof typeof severities, "trace">,
  message: string,
  context: LogContext,
  error?: unknown,
) {
  if (!pinoLogger.isLevelEnabled(level)) return;
  const request = getRequestLogContext();
  const stack = getSafeStack(error);
  const errorType =
    error === undefined ? safe(context.errorType) : getSafeErrorName(error);
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const trace =
    project &&
    /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project) &&
    request?.traceId
      ? `projects/${project}/traces/${request.traceId}`
      : undefined;
  const safeMessage = sanitizeLogText(message);
  const record = {
    serviceContext: {
      service: process.env.K_SERVICE || name,
      version: process.env.K_REVISION || version,
    },
    release: `${name}@${version}`,
    environment: process.env.APP_ENV || process.env.NODE_ENV,
    operation: safe(context.operation),
    event: safe(context.event),
    origin: context.origin ?? "server",
    source: safe(context.source),
    form: safe(context.form),
    stage: safe(context.stage),
    code: safe(context.code),
    route: sanitizeLogRoute(context.route ?? request?.route ?? ""),
    method: safe(context.method ?? request?.method),
    requestId: request?.requestId,
    journeyId: request?.journeyId,
    durationMs: request ? Date.now() - request.startedAt : undefined,
    traceId: request?.traceId,
    "logging.googleapis.com/trace": trace,
    "logging.googleapis.com/spanId": trace ? request?.spanId : undefined,
    "logging.googleapis.com/trace_sampled": trace
      ? request?.traceSampled
      : undefined,
    status: finite(context.status),
    upstreamStatus: finite(context.upstreamStatus),
    errorType,
    errorId: safe(context.errorId),
    reason: safe(context.reason),
    digest: safe(context.digest),
    messageIds: context.messageIds?.filter(Number.isFinite).slice(0, 20),
    confidence: finite(context.confidence),
    similarity: finite(context.similarity),
    threshold: finite(context.threshold),
    attemptNumber: finite(context.attemptNumber),
    retryAfterSeconds: finite(context.retryAfterSeconds),
    detectorState: safe(context.detectorState),
    flowRef: logReference(context.flowId),
    sessionRef: logReference(context.sessionId),
    identityRef: logReference(context.identityId),
    hasContact: context.hasContact,
    commentLength: finite(context.commentLength),
  };
  pinoLogger[level](
    record,
    stack ? `${errorType ?? "Error"}: ${safeMessage}\n${stack}` : safeMessage,
  );
}

export const logger = {
  debug: (message: string, context: LogContext) =>
    writeLog("debug", message, context),
  info: (message: string, context: LogContext) =>
    writeLog("info", message, context),
  warn: (message: string, context: LogContext, error?: unknown) =>
    writeLog("warn", message, context, error),
  error: (message: string, context: LogContext, error?: unknown) =>
    writeLog("error", message, context, error),
  fatal: (message: string, context: LogContext, error?: unknown) =>
    writeLog("fatal", message, context, error),
};
