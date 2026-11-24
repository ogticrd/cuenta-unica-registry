import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import { parseJsonRequest } from "@/lib/services/api-response";
import { verifyCitizenLiveness } from "@/lib/services/biometric/citizen-liveness.service";
import { getRegistrationBiometricConfig } from "@/lib/services/registration/registration-biometric-attempt.service";
import { createLivenessSession } from "@/lib/services/registration/rekognition.service";
import {
  clearVidSessionCookie,
  createVidSessionCookie,
  getVidSession,
  vidFlowIdSchema,
} from "@/lib/services/vid/vid-session.service";
import type {
  VidLivenessErrorCode,
  VidLivenessResponse,
} from "@/lib/types/vid";

const requestSchema = z.discriminatedUnion("stage", [
  z.object({
    stage: z.literal("start"),
    flowId: vidFlowIdSchema,
    retry: z.boolean(),
  }),
  z.object({
    stage: z.literal("complete"),
    flowId: vidFlowIdSchema,
    sessionId: z.string().min(1).max(256),
  }),
]);
const headers = { "Cache-Control": "no-store" };

async function handlePOST(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0] !== "application/json"
  ) {
    return NextResponse.json(
      { success: false, code: "invalid_payload" },
      { status: 400, headers },
    );
  }
  const parsed = await parseJsonRequest(request, requestSchema);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: parsed.code },
      { status: 400, headers },
    );
  }

  const { data } = parsed;
  function fail(code: VidLivenessErrorCode, status: number) {
    return NextResponse.json<VidLivenessResponse>(
      { success: false, code, stage: data.stage },
      { status, headers },
    );
  }

  try {
    const session = await getVidSession(data.flowId);
    if (!session) {
      return fail("flow_expired", 410);
    }

    if (data.stage === "start") {
      if (session.challenge && !data.retry) {
        return NextResponse.json<VidLivenessResponse>(
          { success: true, sessionId: session.challenge.sessionId },
          { headers },
        );
      }
      const attempt = (session.challenge?.attempt ?? 0) + 1;
      if (attempt > getRegistrationBiometricConfig().maxAttempts) {
        logger.warn("Se alcanzó el límite de intentos biométricos", {
          operation: "vid.liveness",
          event: "biometric_liveness_session_blocked",
          source: "vid",
          code: "attempt_limit",
          attemptNumber: attempt,
        });
        return fail("attempt_limit", 429);
      }

      const requestToken = createHash("sha256")
        .update(`vid:${session.id}:${attempt}`)
        .digest("hex");
      const sessionId = await createLivenessSession(requestToken).catch(
        (error: unknown) => {
          logger.error(
            "[vid] Unable to create liveness challenge",
            { operation: "app.api.vid.liveness.route" },
            error,
          );
          return null;
        },
      );
      if (!sessionId) {
        return fail("rekognition_error", 502);
      }
      if (session.expiresAt <= Date.now()) {
        return fail("flow_expired", 410);
      }

      const response = NextResponse.json<VidLivenessResponse>(
        { success: true, sessionId },
        { headers },
      );
      logger.info("Sesión de prueba de vida creada", {
        operation: "vid.liveness",
        event: "rekognition_liveness_session_created",
        source: "vid",
        attemptNumber: attempt,
        sessionId,
      });
      response.cookies.set(
        createVidSessionCookie({
          ...session,
          challenge: { sessionId, attempt },
        }),
      );
      return response;
    }

    if (session.challenge?.sessionId !== data.sessionId) {
      return fail("invalid_session_id", 400);
    }
    const result = await verifyCitizenLiveness(
      data.sessionId,
      session.cedula,
      "vid",
    );
    if (!result.success) {
      return fail(result.code, result.status);
    }
    if (session.expiresAt <= Date.now()) {
      return fail("flow_expired", 410);
    }

    const destination = new URL(session.redirectUri);
    if (session.state) {
      destination.searchParams.set("state", session.state);
    }
    const response = NextResponse.json<VidLivenessResponse>(
      { success: true, redirectTo: destination.href },
      { headers },
    );
    response.cookies.set(clearVidSessionCookie(session.id));
    return response;
  } catch (error) {
    logger.error(
      "[vid] Unable to process liveness",
      { operation: "app.api.vid.liveness.route" },
      error,
    );
    return fail("unexpected_error", 500);
  }
}

export const POST = withRequestLogging("/api/vid/liveness", handlePOST);
