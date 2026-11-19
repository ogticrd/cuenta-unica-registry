import { NextResponse } from "next/server";
import { z } from "zod";
import {
  RECAPTCHA_PROOF_COOKIE,
  RECOVERY_RECAPTCHA_ACTION,
  serializeRecaptchaProof,
} from "@/lib/security/recaptcha-proof-core";
import { validateRecaptchaToken } from "@/lib/services/recaptcha/recaptcha.service";

const requestSchema = z.object({
  token: z.string().min(1),
  action: z.literal(RECOVERY_RECAPTCHA_ACTION),
});

export async function POST(request: Request) {
  const parsedRequest = requestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsedRequest.success) {
    return NextResponse.json(
      { success: false, code: "invalid_payload" },
      { status: 400 },
    );
  }

  const isValid = await validateRecaptchaToken(
    parsedRequest.data.token,
    parsedRequest.data.action,
  );

  if (!isValid) {
    return NextResponse.json(
      { success: false, code: "recaptcha_failed" },
      { status: 403 },
    );
  }

  const secret = process.env.REGISTRATION_SESSION_SECRET;
  if (!secret) {
    console.error("[/api/security/recaptcha] Missing signing secret");
    return NextResponse.json(
      { success: false, code: "unexpected_error" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set({
    name: RECAPTCHA_PROOF_COOKIE,
    value: await serializeRecaptchaProof(parsedRequest.data.action, secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 2 * 60,
  });

  return response;
}
