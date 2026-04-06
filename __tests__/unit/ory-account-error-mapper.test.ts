import { describe, expect, it } from "vitest";
import type { UiNode } from "@ory/client";
import { mapOryAccountErrors } from "@/lib/services/registration/ory-account-error-mapper";

/**
 * Helper to build a minimal UiNode for testing.
 * The production code only accesses `attributes.name` and `messages[].{id, text}`,
 * so we cast partial objects to satisfy the broader UiNode type.
 */
function createNode(
  attributeName: string,
  messages: { id: number; text: string }[],
): UiNode {
  return {
    messages: messages.map((m) => ({ ...m, type: "error", context: {} })),
    attributes: {
      name: attributeName,
      node_type: "input",
      disabled: false,
      type: "text",
    },
    type: "input",
    group: "password",
    meta: {},
  } as unknown as UiNode;
}

describe("mapOryAccountErrors", () => {
  it("returns identity_exists when a duplicate-email message ID is present (4000007)", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [
          createNode("traits.email", [
            { id: 4000007, text: "An account with this email already exists." },
          ]),
        ],
      },
    });

    expect(result.code).toBe("identity_exists");
    expect(result.fieldErrors?.email).toBe("identities.messages.4000007");
  });

  it("returns identity_exists when a duplicate-email message ID is present (4000027)", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [
          createNode("traits.email", [
            { id: 4000027, text: "Account exists, sign in to continue." },
          ]),
        ],
      },
    });

    expect(result.code).toBe("identity_exists");
    expect(result.fieldErrors?.email).toBe("identities.messages.4000027");
  });

  it("detects duplicate-email via text pattern when message ID is unknown", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [
          createNode("traits.email", [
            {
              id: 9999,
              text: "An account with this email already exists.",
            },
          ]),
        ],
      },
    });

    expect(result.code).toBe("identity_exists");
    expect(result.fieldErrors?.email).toBe("identities.messages.4000007");
  });

  it("detects duplicate-email via Spanish text pattern", () => {
    const result = mapOryAccountErrors({
      ui: {
        messages: [
          {
            id: 9999,
            text: "Ya existe una cuenta con este correo.",
            type: "error",
            context: {},
          },
        ] as unknown as { id: number; text: string }[],
      },
    });

    expect(result.code).toBe("identity_exists");
  });

  it("maps password errors for known password message IDs", () => {
    const passwordMessageIds = [4000005, 4000031, 4000032, 4000033, 4000034];

    for (const messageId of passwordMessageIds) {
      const result = mapOryAccountErrors({
        ui: {
          nodes: [
            createNode("password", [{ id: messageId, text: "Password issue" }]),
          ],
        },
      });

      expect(result.code).toBe("ory_validation_error");
      expect(result.fieldErrors?.password).toBe(
        `identities.messages.${messageId}`,
      );
    }
  });

  it("resolves email field from node attribute name containing 'email'", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [
          createNode("traits.email", [
            { id: 4000007, text: "Already exists" },
          ]),
        ],
      },
    });

    expect(result.fieldErrors?.email).toBeDefined();
  });

  it("resolves password field from node attribute name containing 'password'", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [
          createNode("password", [{ id: 4000005, text: "Weak password" }]),
        ],
      },
    });

    expect(result.fieldErrors?.password).toBeDefined();
  });

  it("returns ory_validation_error with no fieldErrors for empty payload", () => {
    const result = mapOryAccountErrors({});

    expect(result.code).toBe("ory_validation_error");
    expect(result.fieldErrors).toBeUndefined();
  });

  it("returns ory_validation_error when nodes have no messages", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [createNode("traits.email", [])],
      },
    });

    expect(result.code).toBe("ory_validation_error");
    expect(result.fieldErrors).toBeUndefined();
  });

  it("collects error from payload.error.reason", () => {
    const result = mapOryAccountErrors({
      error: {
        reason:
          "An account with this email already exists in the system.",
      },
    });

    expect(result.code).toBe("identity_exists");
  });

  it("collects error from payload.error.message when reason is absent", () => {
    const result = mapOryAccountErrors({
      error: {
        message: "Ya existe una cuenta.",
      },
    });

    expect(result.code).toBe("identity_exists");
  });

  it("skips messages with empty text", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [createNode("traits.email", [{ id: 4000007, text: "" }])],
      },
    });

    expect(result.code).toBe("ory_validation_error");
    expect(result.fieldErrors).toBeUndefined();
  });

  it("returns identity_exists immediately on first duplicate-identifier match", () => {
    const result = mapOryAccountErrors({
      ui: {
        nodes: [
          createNode("traits.email", [
            { id: 4000007, text: "Email already exists" },
          ]),
          createNode("password", [{ id: 4000005, text: "Weak password" }]),
        ],
      },
    });

    expect(result.code).toBe("identity_exists");
    // Password error is not included because identity_exists short-circuits
    expect(result.fieldErrors?.password).toBeUndefined();
  });

  it("collects ui.messages (non-node messages)", () => {
    const result = mapOryAccountErrors({
      ui: {
        messages: [
          {
            id: 4000007,
            text: "Already exists",
            type: "error",
            context: {},
          },
        ] as unknown as { id: number; text: string }[],
      },
    });

    expect(result.code).toBe("identity_exists");
  });
});
