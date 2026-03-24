import type { UiNode, UiText } from "@ory/client";

import type {
  RegisterAccountErrorCode,
  RegisterAccountFieldErrors,
} from "@/lib/types/registration/account";

type OryMessage = Pick<UiText, "id" | "text">;
type AccountField = keyof RegisterAccountFieldErrors;

interface OryAccountErrorPayload {
  ui?: {
    nodes?: UiNode[];
    messages?: OryMessage[];
  };
  error?: {
    id?: string;
    message?: string;
    reason?: string;
  };
}

interface OryFieldMessage {
  field?: AccountField;
  message: OryMessage;
}

interface MappedOryAccountError {
  code: RegisterAccountErrorCode;
  fieldErrors?: RegisterAccountFieldErrors;
}

const DUPLICATE_IDENTIFIER_MESSAGE_IDS = new Set<number>([4000007, 4000027]);
const PASSWORD_MESSAGE_IDS = new Set<number>([
  4000005, 4000031, 4000032, 4000033, 4000034,
]);
const DUPLICATE_IDENTIFIER_PATTERN =
  /already exists|exists already|already been used|already in use|ya existe|ya esta en uso|ya ha sido usado|ya fue usado|ya esta siendo usado/i;

function resolveField(node: UiNode): AccountField | undefined {
  const attributeName =
    node.attributes && "name" in node.attributes
      ? String(node.attributes.name ?? "")
      : "";

  if (attributeName.includes("email")) {
    return "email";
  }

  if (attributeName.includes("password")) {
    return "password";
  }

  return undefined;
}

function collectFieldMessages(
  payload: OryAccountErrorPayload,
): OryFieldMessage[] {
  const messages: OryFieldMessage[] = [];

  for (const node of payload.ui?.nodes ?? []) {
    const field = resolveField(node);

    for (const message of node.messages ?? []) {
      if (!message.text) {
        continue;
      }

      messages.push({
        field,
        message: {
          id: message.id,
          text: message.text,
        },
      });
    }
  }

  for (const message of payload.ui?.messages ?? []) {
    if (!message.text) {
      continue;
    }

    messages.push({
      message: {
        id: message.id,
        text: message.text,
      },
    });
  }

  const rawError = payload.error?.reason || payload.error?.message;

  if (rawError) {
    messages.push({
      message: {
        id: -1,
        text: rawError,
      },
    });
  }

  return messages;
}

function toOryMessageKey(messageId: number) {
  return `identities.messages.${messageId}`;
}

function mapFieldError(fieldMessage: OryFieldMessage) {
  const { field, message } = fieldMessage;

  if (DUPLICATE_IDENTIFIER_MESSAGE_IDS.has(message.id)) {
    return {
      field: "email" as const,
      key: toOryMessageKey(message.id),
      code: "identity_exists" as const,
    };
  }

  if (PASSWORD_MESSAGE_IDS.has(message.id) && field === "password") {
    return {
      field,
      key: toOryMessageKey(message.id),
      code: "ory_validation_error" as const,
    };
  }

  if (DUPLICATE_IDENTIFIER_PATTERN.test(message.text)) {
    return {
      field: "email" as const,
      key: toOryMessageKey(4000007),
      code: "identity_exists" as const,
    };
  }

  return undefined;
}

export function mapOryAccountErrors(
  payload: OryAccountErrorPayload,
): MappedOryAccountError {
  const collectedMessages = collectFieldMessages(payload);
  const fieldErrors: RegisterAccountFieldErrors = {};

  for (const fieldMessage of collectedMessages) {
    const mapped = mapFieldError(fieldMessage);

    if (!mapped) {
      continue;
    }

    fieldErrors[mapped.field] = mapped.key;

    if (mapped.code === "identity_exists") {
      return {
        code: "identity_exists",
        fieldErrors,
      };
    }
  }

  return Object.keys(fieldErrors).length > 0
    ? {
        code: "ory_validation_error",
        fieldErrors,
      }
    : {
        code: "ory_validation_error",
      };
}
