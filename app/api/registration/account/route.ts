import type { UiNode, UiText } from "@ory/client"
import { NextResponse } from "next/server"
import { accountRequestSchema } from "@/lib/schemas/registration"
import { ROUTES } from "@/lib/constants/routes"
import { getServerCookies } from "@/lib/ory/cookies"
import { registerOryAccount } from "@/lib/services/registration/ory-registration.service"
import { findCitizenByCedula } from "@/lib/services/registration/citizen-registry.service"
import type {
  RegisterAccountErrorCode,
  RegisterAccountFieldError,
  RegisterAccountRequest,
  RegisterAccountResponse,
} from "@/lib/types/registration/account"
import { isValidCedula, normalizeCedula } from "@/lib/utils/cedula"

type OryMessage = Pick<UiText, "type" | "text">

function createJsonResponse(
  payload: RegisterAccountResponse,
  status: number,
  setCookies: string[] = [],
) {
  const response = NextResponse.json(payload, { status })

  for (const setCookie of setCookies) {
    response.headers.append("Set-Cookie", setCookie)
  }

  return response
}

function createErrorResponse(
  code: RegisterAccountErrorCode,
  status: number,
  options?: {
    fieldErrors?: RegisterAccountFieldError
    formError?: string
    setCookies?: string[]
  },
) {
  const payload: RegisterAccountResponse = {
    success: false,
    code,
    fieldErrors: options?.fieldErrors,
    formError: options?.formError,
  }

  return createJsonResponse(payload, status, options?.setCookies)
}

function collectNodeMessages(nodes: UiNode[] = []) {
  const fieldErrors: RegisterAccountFieldError = {}
  const formMessages: string[] = []

  for (const node of nodes) {
    const attributeName =
      node.attributes && "name" in node.attributes
        ? String(node.attributes.name ?? "")
        : ""

    for (const message of node.messages ?? []) {
      if (!message.text) {
        continue
      }

      if (attributeName.includes("email")) {
        fieldErrors.email = message.text
        continue
      }

      if (attributeName.includes("password")) {
        fieldErrors.password = message.text
        continue
      }

      formMessages.push(message.text)
    }
  }

  return { fieldErrors, formMessages }
}

function extractUiMessages(messages: OryMessage[] = []) {
  return messages
    .filter((message) => message.text)
    .map((message) => String(message.text))
}

function resolveOryErrors(payload: {
  ui?: {
    nodes?: UiNode[]
    messages?: OryMessage[]
  }
  error?: {
    id?: string
    message?: string
    reason?: string
  }
}) {
  const { fieldErrors, formMessages } = collectNodeMessages(payload.ui?.nodes)
  const topLevelMessages = extractUiMessages(payload.ui?.messages)
  const errorMessage = payload.error?.reason || payload.error?.message
  const allMessages = [...formMessages, ...topLevelMessages]

  if (errorMessage) {
    allMessages.push(errorMessage)
  }

  const identityExists = allMessages.some((message) =>
    /already exists|exists already|already been used|already in use/i.test(message),
  )

  return {
    fieldErrors,
    formError: allMessages[0],
    code: identityExists ? "identity_exists" : "ory_validation_error",
  } as const
}

export async function POST(request: Request) {
  let body: RegisterAccountRequest | null = null

  try {
    body = (await request.json()) as RegisterAccountRequest
  } catch (error) {
    console.error("[/api/registration/account] Invalid request body:", error)
    return createErrorResponse("invalid_payload", 400)
  }

  const parsedRequest = accountRequestSchema.safeParse(body)

  if (!parsedRequest.success) {
    return createErrorResponse("invalid_payload", 400)
  }

  const cedula = normalizeCedula(parsedRequest.data.cedula)

  if (!(await isValidCedula(cedula))) {
    return createErrorResponse("invalid_cedula", 400)
  }

  const citizen = await findCitizenByCedula(cedula)

  if (!citizen) {
    return createErrorResponse("citizen_not_found", 404)
  }

  try {
    const incomingCookies = await getServerCookies()
    const { payload, setCookies } = await registerOryAccount({
      cookie: incomingCookies,
      email: parsedRequest.data.email,
      password: parsedRequest.data.password,
      cedula,
      firstName: citizen.firstName,
      lastName: citizen.lastName,
      birthDate: citizen.birthDate,
      gender: citizen.gender,
    })

    if (payload.ui) {
      const errorDetails = resolveOryErrors(payload)

      return createErrorResponse(errorDetails.code, 400, {
        fieldErrors: errorDetails.fieldErrors,
        formError: errorDetails.formError,
        setCookies,
      })
    }

    if (payload.error) {
      const errorDetails = resolveOryErrors(payload)
      const status =
        payload.error.id === "security_csrf_violation" ? 400 : 502

      console.error("[/api/registration/account] Ory returned an error payload:", payload.error)

      return createErrorResponse(errorDetails.code, status, {
        fieldErrors: errorDetails.fieldErrors,
        formError: errorDetails.formError,
        setCookies,
      })
    }

    for (const block of payload.continue_with ?? []) {
      if (block.action === "show_verification_ui" && block.flow?.id) {
        const responsePayload: RegisterAccountResponse = {
          success: true,
          destination: "verification",
          redirectTo: `${ROUTES.verification}?flow=${encodeURIComponent(block.flow.id)}`,
        }

        return createJsonResponse(responsePayload, 200, setCookies)
      }
    }

    if (payload.identity?.id) {
      const responsePayload: RegisterAccountResponse = {
        success: true,
        destination: "login",
        redirectTo: `${ROUTES.login}?registered=true`,
      }

      return createJsonResponse(responsePayload, 200, setCookies)
    }

    return createErrorResponse("unexpected_error", 500, { setCookies })
  } catch (error) {
    console.error("[/api/registration/account] Registration failed:", error)
    return createErrorResponse("unexpected_error", 500)
  }
}
