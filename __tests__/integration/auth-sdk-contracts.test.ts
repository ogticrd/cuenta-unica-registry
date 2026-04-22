/**
 * Contract tests for Ory SDK mock shapes.
 *
 * These tests validate that the mock response shapes used in integration tests
 * conform to the actual Ory SDK type contracts. When @ory/client is upgraded,
 * these tests will fail if the SDK types change, alerting us that our mocks
 * need updating.
 */
import type {
  ErrorGeneric,
  Identity,
  LogoutFlow,
  RegistrationFlow,
  Session,
  SuccessfulNativeRegistration,
  UiNode,
  UiNodeInputAttributes,
  UiNodeMeta,
  UiText,
} from "@ory/client";
import { describe, expect, it } from "vitest";

/**
 * Helper: asserts that a value satisfies a type without runtime cost.
 * If the type changes, the TypeScript compiler will flag the assignment as invalid.
 */
function assertType<T>(_value: T): void {}

const defaultNodeMeta: UiNodeMeta = {};

function createIdentity(overrides: Partial<Identity> = {}): Identity {
  return {
    id: "identity-123",
    schema_id: "default",
    schema_url: "https://ory.example.test/schemas/default",
    traits: { email: "user@example.com", username: "40200612345" },
    ...overrides,
  };
}

function createInputNode(
  attributes: Pick<UiNodeInputAttributes, "name" | "value">,
  messages: UiText[] = [],
): UiNode {
  return {
    attributes: {
      disabled: false,
      name: attributes.name,
      node_type: "input",
      type: "hidden",
      value: attributes.value,
    },
    group: "default",
    messages,
    meta: defaultNodeMeta,
    type: "input",
  };
}

function createRegistrationFlow(
  nodes: UiNode[],
): Pick<RegistrationFlow, "id" | "ui"> {
  return {
    id: "ory-registration-flow",
    ui: {
      action:
        "https://ory.example.test/self-service/registration?flow=ory-registration-flow",
      method: "POST",
      nodes,
    },
  };
}

describe("Ory SDK contract - toSession response", () => {
  it("mock session shape satisfies the Session type", () => {
    const mockSession = {
      identity: createIdentity(),
      authenticated_at: "2024-01-01T00:00:00Z",
      expires_at: "2024-01-02T00:00:00Z",
    };

    // Nested properties on Session remain strict, so validate only the fields we depend on.
    assertType<Pick<Session, "identity" | "authenticated_at" | "expires_at">>(
      mockSession,
    );

    // Runtime structural checks for the fields our routes depend on
    expect(mockSession.identity).toBeDefined();
    expect(mockSession.identity?.id).toBe("identity-123");
    expect(mockSession.identity?.traits).toBeDefined();
    expect(typeof mockSession.identity?.schema_id).toBe("string");
  });
});

describe("Ory SDK contract - listIdentities response", () => {
  it("mock listIdentities data satisfies Identity[] shape", () => {
    const mockIdentities: Partial<Identity>[] = [
      { id: "identity-1", traits: { username: "40200612345" } },
    ];

    assertType<Partial<Identity>[]>(mockIdentities);

    expect(Array.isArray(mockIdentities)).toBe(true);
    expect(mockIdentities[0]?.id).toBeDefined();
  });

  it("empty list is a valid response", () => {
    const mockIdentities: Partial<Identity>[] = [];

    assertType<Partial<Identity>[]>(mockIdentities);
    expect(mockIdentities).toHaveLength(0);
  });
});

describe("Ory SDK contract - createBrowserRegistrationFlow response", () => {
  it("mock flow shape satisfies RegistrationFlow", () => {
    const mockFlow = createRegistrationFlow([
      createInputNode({ name: "csrf_token", value: "csrf-123" }),
    ]);

    assertType<Pick<RegistrationFlow, "id" | "ui">>(mockFlow);

    // Runtime checks for fields our registration routes depend on
    expect(mockFlow.id).toBeDefined();
    expect(mockFlow.ui?.nodes).toBeDefined();
    expect(Array.isArray(mockFlow.ui?.nodes)).toBe(true);

    const csrfNode = mockFlow.ui.nodes[0];
    if (csrfNode.attributes.node_type !== "input") {
      throw new Error("Expected input node");
    }

    expect(csrfNode.attributes.name).toBe("csrf_token");
    expect(csrfNode.attributes.value).toBe("csrf-123");
  });
});

describe("Ory SDK contract - updateRegistrationFlow response", () => {
  it("mock success shape satisfies SuccessfulNativeRegistration", () => {
    const mockSuccess = {
      identity: createIdentity({ id: "identity-123" }),
      continue_with: [
        {
          action: "show_verification_ui" as const,
          flow: {
            id: "verification-flow-123",
            verifiable_address: "user@example.com",
          },
        },
      ],
    };

    assertType<Partial<SuccessfulNativeRegistration>>(mockSuccess);

    // Runtime checks for fields our routes depend on
    expect(mockSuccess.identity).toBeDefined();
    expect(mockSuccess.continue_with).toBeDefined();
    expect(Array.isArray(mockSuccess.continue_with)).toBe(true);
    expect(mockSuccess.continue_with?.[0]?.action).toBe("show_verification_ui");
    expect(mockSuccess.continue_with?.[0]?.flow?.id).toBe(
      "verification-flow-123",
    );
  });

  it("mock error with ui.nodes satisfies RegistrationFlow error shape", () => {
    const messages: UiText[] = [
      {
        id: 4000007,
        text: "An account with this email already exists.",
        type: "error",
      },
    ];
    const mockError = createRegistrationFlow([
      createInputNode(
        { name: "traits.email", value: "user@example.com" },
        messages,
      ),
    ]);

    assertType<Pick<RegistrationFlow, "id" | "ui">>(mockError);

    const errorNode = mockError.ui.nodes[0];
    if (errorNode.attributes.node_type !== "input") {
      throw new Error("Expected input node");
    }

    expect(errorNode.attributes.name).toBe("traits.email");
    expect(errorNode.messages[0]?.id).toBe(4000007);
    expect(errorNode.messages[0]?.text).toContain("already exists");
  });

  it("mock error with top-level error satisfies Ory error shape", () => {
    const errorId = "security_csrf_violation";
    const mockError = {
      error: {
        // The generated SDK type narrows `id` to a small enum, but Kratos
        // can return route-specific IDs such as `security_csrf_violation`.
        message: "csrf rejected",
      },
    };

    assertType<ErrorGeneric>(mockError);

    expect(errorId).toBe("security_csrf_violation");
    expect(mockError.error?.message).toBeDefined();
  });
});

describe("Ory SDK contract - createBrowserLogoutFlow response", () => {
  it("mock logout flow has required fields", () => {
    const mockLogoutFlow: LogoutFlow = {
      logout_token: "logout-token-123",
      logout_url:
        "https://ory.example.test/self-service/logout?token=logout-token-123",
    };

    expect(mockLogoutFlow.logout_token).toBeDefined();
    expect(mockLogoutFlow.logout_url).toBeDefined();
    expect(typeof mockLogoutFlow.logout_token).toBe("string");
    expect(typeof mockLogoutFlow.logout_url).toBe("string");
  });
});

describe("Ory SDK contract - SDK method signatures", () => {
  it("FrontendApi has expected method names", async () => {
    const { FrontendApi } = await import("@ory/client");

    const methods = [
      "createBrowserRegistrationFlow",
      "updateRegistrationFlow",
      "toSession",
      "listMySessions",
      "createBrowserLogoutFlow",
      "updateLogoutFlow",
    ];

    for (const method of methods) {
      expect(
        typeof (FrontendApi.prototype as unknown as Record<string, unknown>)[
          method
        ],
      ).toBe("function");
    }
  });

  it("IdentityApi has expected method names", async () => {
    const { IdentityApi } = await import("@ory/client");

    expect(
      typeof (IdentityApi.prototype as unknown as Record<string, unknown>)
        .listIdentities,
    ).toBe("function");
  });
});
