import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import {
  type AnalyticsEnvironment,
  resolveAnalyticsEnvironment,
} from "@/lib/analytics/environment";
import { feedbackApiPayloadSchema } from "@/lib/schemas/feedback/feedback.schema";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import { submitSupportRequest } from "@/lib/services/support/support-request.service";
import type { RegistrationSession } from "@/lib/types/registration/session";

function buildSupportRequestId() {
  return `feedback_${crypto.randomUUID()}`;
}

function buildAccountIdFromCedula(cedula: string) {
  return `acct_${createHash("sha256")
    .update(`cedula:${cedula}`)
    .digest("hex")
    .slice(0, 32)}`;
}

function registrationStepFromSession(session: RegistrationSession | null) {
  if (!session) {
    return "unknown";
  }

  if (session.status === "verified") {
    return "liveness";
  }

  return "identification";
}

async function emitSupportRequestedEvent(params: {
  accountId: string;
  requestId: string;
  environment: AnalyticsEnvironment;
  registrationStep: string;
  commentLength: number;
}) {
  return emitAnalyticsEvent(
    {
      eventName: "support.requested",
      source: "registry-app",
      environment: params.environment,
      accountId: params.accountId,
      step: "support",
      outcome: "succeeded",
      metadata: {
        channel: "registration_report",
        requestId: params.requestId,
        registrationStep: params.registrationStep,
        commentLength: params.commentLength,
      },
    },
    { entryPath: "/api/feedback" },
  );
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = feedbackApiPayloadSchema.safeParse(json);
    const requestId = buildSupportRequestId();

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    let registrationSession: RegistrationSession | null = null;
    try {
      registrationSession = await getRegistrationSession();
    } catch (error) {
      console.error(
        "[api/feedback] failed to read registration session",
        error,
      );
    }

    const registrationStep = registrationStepFromSession(registrationSession);
    const environment = resolveAnalyticsEnvironment();
    const accountId = buildAccountIdFromCedula(
      registrationSession?.cedula ?? parsed.data.cedula,
    );
    const supportWrite = await submitSupportRequest({
      requestId,
      environment,
      accountId,
      oryIdentityId: null,
      channel: "registration_report",
      message: parsed.data.comments,
      contactEmail: parsed.data.email,
      contactName: parsed.data.name ?? null,
      registrationStep,
    });

    if (!supportWrite.success) {
      console.error("[api/feedback] support request storage failed", {
        requestId,
        commentLength: parsed.data.comments.length,
      });
      return NextResponse.json(
        { success: false, code: supportWrite.code },
        { status: supportWrite.code === "NOT_CONFIGURED" ? 503 : 502 },
      );
    }

    const emitted = await emitSupportRequestedEvent({
      accountId,
      requestId,
      environment,
      registrationStep,
      commentLength: parsed.data.comments.length,
    });

    if (!emitted) {
      console.error("[api/feedback] support analytics delivery failed", {
        requestId,
        commentLength: parsed.data.comments.length,
      });
      return NextResponse.json(
        { success: false, code: "SERVER_ERROR" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, requestId }, { status: 200 });
  } catch (error) {
    console.error("[api/feedback] network/internal error:", error);
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
