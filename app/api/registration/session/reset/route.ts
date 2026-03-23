import { NextResponse } from "next/server"
import {
  clearRegistrationSessionCookie,
} from "@/lib/services/registration/registration-session.service"
import type { RegistrationSessionResetResponse } from "@/lib/types/registration/session"

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true } satisfies RegistrationSessionResetResponse,
      { status: 200 },
    )
    response.cookies.set(clearRegistrationSessionCookie())

    return response
  } catch (error) {
    console.error("[/api/registration/session/reset] Failed to clear registration session:", error)

    return NextResponse.json(
      {
        success: false,
        code: "unexpected_error",
      } satisfies RegistrationSessionResetResponse,
      { status: 500 },
    )
  }
}
