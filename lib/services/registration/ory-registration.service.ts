import "server-only";

import type {
  RegistrationFlow,
  SuccessfulNativeRegistration,
  UiNode,
} from "@ory/client";
import { withAnalyticsTransientPayload } from "@/lib/analytics/transient-payload";
import { createOryClient } from "@/lib/ory/client";
import { mergeCookieHeaders } from "@/lib/ory/cookies";

interface RegisterOryAccountInput {
  cookie: string;
  email: string;
  password: string;
  cedula: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "M" | "F";
}

export interface OryRegistrationPayload {
  ui?: RegistrationFlow["ui"];
  continue_with?: SuccessfulNativeRegistration["continue_with"];
  identity?: SuccessfulNativeRegistration["identity"];
  error?: {
    id?: string;
    code?: number;
    message?: string;
    reason?: string;
  };
}

export interface RegisterOryAccountResult {
  payload: OryRegistrationPayload;
  setCookies: string[];
}

function findNodeValue(nodes: UiNode[] = [], fieldName: string) {
  const node = nodes.find((currentNode) => {
    const attributes = currentNode.attributes as unknown as Record<
      string,
      unknown
    > | null;

    return (
      typeof attributes === "object" &&
      attributes !== null &&
      attributes.name === fieldName &&
      "value" in attributes
    );
  });

  if (!node) {
    return undefined;
  }

  const attributes = node.attributes as unknown as Record<string, unknown>;
  return typeof attributes.value === "string" ? attributes.value : undefined;
}

export async function registerOryAccount(
  input: RegisterOryAccountInput,
): Promise<RegisterOryAccountResult> {
  const oryClient = createOryClient();

  const createFlowResponse = await oryClient.createBrowserRegistrationFlow(
    {},
    {
      headers: {
        Accept: "application/json",
        Cookie: input.cookie,
      },
    },
  );
  const csrfToken = findNodeValue(
    createFlowResponse.data.ui?.nodes,
    "csrf_token",
  );
  const createFlowSetCookieHeader = createFlowResponse.headers["set-cookie"];
  const createFlowSetCookies = Array.isArray(createFlowSetCookieHeader)
    ? createFlowSetCookieHeader
    : createFlowSetCookieHeader
      ? [createFlowSetCookieHeader as string]
      : [];
  const csrfCookieHeader = mergeCookieHeaders(
    input.cookie,
    createFlowSetCookies,
  );

  const updateResponse = await oryClient
    .updateRegistrationFlow(
      {
        flow: createFlowResponse.data.id,
        cookie: csrfCookieHeader || input.cookie,
        updateRegistrationFlowBody: await withAnalyticsTransientPayload({
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
        }),
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    )
    .then((response) => response)
    .catch((error) => error.response);

  const updateSetCookieHeader = updateResponse?.headers?.["set-cookie"];
  const updateSetCookies = Array.isArray(updateSetCookieHeader)
    ? updateSetCookieHeader
    : updateSetCookieHeader
      ? [updateSetCookieHeader as string]
      : [];
  const setCookies = [...createFlowSetCookies, ...updateSetCookies];

  return {
    payload: (updateResponse?.data ?? {}) as OryRegistrationPayload,
    setCookies,
  };
}
