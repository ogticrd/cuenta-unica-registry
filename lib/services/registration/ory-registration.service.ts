import "server-only"

import type { RegistrationFlow, SuccessfulNativeRegistration, UiNode } from "@ory/client"
import { createOryClient } from "@/lib/ory/client"
import { mergeCookieHeaders } from "@/lib/ory/cookies"

interface RegisterOryAccountInput {
  cookie: string
  email: string
  password: string
  cedula: string
  firstName: string
  lastName: string
  birthDate: string
  gender: "M" | "F"
}

export interface OryRegistrationPayload {
  ui?: RegistrationFlow["ui"]
  continue_with?: SuccessfulNativeRegistration["continue_with"]
  identity?: SuccessfulNativeRegistration["identity"]
  error?: {
    id?: string
    code?: number
    message?: string
    reason?: string
  }
}

export interface RegisterOryAccountResult {
  payload: OryRegistrationPayload
  setCookies: string[]
}

function findNodeValue(nodes: UiNode[] = [], fieldName: string) {
  for (const node of nodes) {
    if (!node.attributes || !("name" in node.attributes)) {
      continue
    }

    if (String(node.attributes.name) !== fieldName) {
      continue
    }

    if (!("value" in node.attributes)) {
      continue
    }

    return typeof node.attributes.value === "string"
      ? node.attributes.value
      : undefined
  }

  return undefined
}

export async function registerOryAccount(
  input: RegisterOryAccountInput,
): Promise<RegisterOryAccountResult> {
  const oryClient = createOryClient()

  const createFlowResponse = await oryClient.createBrowserRegistrationFlow(
    {},
    {
      headers: {
        Accept: "application/json",
        Cookie: input.cookie,
      },
    },
  )
  const csrfToken = findNodeValue(createFlowResponse.data.ui?.nodes, "csrf_token")

  const createFlowCookies = createFlowResponse.headers["set-cookie"]
  const createFlowSetCookies = Array.isArray(createFlowCookies)
    ? createFlowCookies
    : createFlowCookies
      ? [createFlowCookies]
      : []
  const csrfCookieHeader = mergeCookieHeaders(input.cookie, createFlowSetCookies)

  const updateResponse = await oryClient
    .updateRegistrationFlow(
      {
        flow: createFlowResponse.data.id,
        cookie: csrfCookieHeader || input.cookie,
        updateRegistrationFlowBody: {
          csrf_token: csrfToken,
          method: "password",
          password: input.password,
          traits: {
            email: input.email,
            username: input.cedula,
            name: {
              first: input.firstName,
              last: input.lastName,
            },
            birthdate: input.birthDate,
            gender: input.gender,
          },
        },
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    )
    .then((response) => response)
    .catch((error) => error.response)

  const updateCookies = updateResponse?.headers?.["set-cookie"]
  const setCookies = [
    ...createFlowSetCookies,
    ...(Array.isArray(updateCookies)
      ? updateCookies
      : updateCookies
        ? [updateCookies]
        : []),
  ]

  return {
    payload: (updateResponse?.data ?? {}) as OryRegistrationPayload,
    setCookies,
  }
}
