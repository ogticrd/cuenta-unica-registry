import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { z } from "zod";

export const VID_FLOW_DURATION_SECONDS = 120;
export const vidFlowIdSchema = z.uuidv4();

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_CONTEXT = "vid-flow-cookie:v1";
const sessionSchema = z.object({
  id: vidFlowIdSchema,
  cedula: z.string().regex(/^\d{11}$/),
  firstName: z.string(),
  redirectUri: z.string(),
  state: z.string().optional(),
  expiresAt: z.number().int(),
  challenge: z
    .object({
      sessionId: z.string(),
      attempt: z.number().int().positive(),
    })
    .optional(),
});

export type VidSession = z.infer<typeof sessionSchema>;

function getKey() {
  const secret = process.env.REGISTRATION_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing REGISTRATION_SESSION_SECRET environment variable");
  }
  return createHash("sha256")
    .update(KEY_CONTEXT)
    .update("\0")
    .update(secret)
    .digest();
}

function getCookieName(flowId: string) {
  return `vid_flow_${flowId}`;
}

function cookieOptions(flowId: string) {
  return {
    name: getCookieName(flowId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  } as const;
}

export function createVidSessionCookie(session: VidSession): ResponseCookie {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);

  return {
    ...cookieOptions(session.id),
    value: Buffer.concat([iv, cipher.getAuthTag(), payload]).toString(
      "base64url",
    ),
    maxAge: Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000)),
  };
}

export function clearVidSessionCookie(flowId: string): ResponseCookie {
  return { ...cookieOptions(flowId), value: "", maxAge: 0 };
}

export async function getVidSession(
  flowId: string,
): Promise<VidSession | null> {
  if (!vidFlowIdSchema.safeParse(flowId).success) {
    return null;
  }

  const value = (await cookies()).get(getCookieName(flowId))?.value;
  if (!value) {
    return null;
  }

  const key = getKey();
  try {
    const encrypted = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      encrypted.subarray(0, IV_LENGTH),
    );
    decipher.setAuthTag(encrypted.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
    const payload = Buffer.concat([
      decipher.update(encrypted.subarray(IV_LENGTH + TAG_LENGTH)),
      decipher.final(),
    ]);
    const result = sessionSchema.safeParse(
      JSON.parse(payload.toString("utf8")),
    );
    if (
      !result.success ||
      result.data.id !== flowId ||
      result.data.expiresAt <= Date.now()
    ) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}
