import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function POST(request: Request) {
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
        return fail("attempt_limit", 429);
      }

      const requestToken = createHash("sha256")
        .update(`vid:${session.id}:${attempt}`)
        .digest("hex");
      const sessionId = await createLivenessSession(requestToken).catch(
        (error: unknown) => {
          console.error("[vid] Unable to create liveness challenge", {
            name: error instanceof Error ? error.name : "UnknownError",
          });
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
    const result = await verifyCitizenLiveness(data.sessionId, session.cedula);
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
    console.error("[vid] Unable to process liveness", {
      stage: data.stage,
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return fail("unexpected_error", 500);
  }
}
