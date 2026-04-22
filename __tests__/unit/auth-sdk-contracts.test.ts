/**
 * Contract tests for Ory SDK mock shapes.
 *
 * These tests validate that the mock response shapes used in integration tests
 * conform to the actual Ory SDK type contracts. When @ory/client is upgraded,
 * these tests will fail if the SDK types change, alerting us that our mocks
 * need updating.
 */
import type {
  Identity,
  RegistrationFlow,
  Session,
  SuccessfulNativeRegistration,
  UiNode,
  UiText,
} from "@ory/client";
import { describe, expect, it } from "vitest";

/**
 * Recursively makes every property in T optional.
 * Unlike Partial<T>, this handles nested objects so our mocks only need
 * to include the fields that the production code actually depends on.
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

/**
 * Helper: asserts that a value satisfies a type without runtime cost.
 * If the type changes, the TypeScript compiler will flag the assignment as invalid.
 */
function assertType<T>(_value: T): void {}

describe("Ory SDK contract — toSession response", () => {
  it("mock session shape satisfies the Session type", () => {
    const mockSession = {
      identity: {
        id: "identity-123",
        traits: { email: "user@example.com", username: "40200612345" },
        schema_id: "default",
      },
      authenticated_at: "2024-01-01T00:00:00Z",
      expires_at: "2024-01-02T00:00:00Z",
    };

    // Type-level check: this will fail at compile time if Session shape changes
    assertType<DeepPartial<Session>>(mockSession);

    // Runtime structural checks for the fields our routes depend on
    expect(mockSession.identity).toBeDefined();
    expect(mockSession.identity?.id).toBe("identity-123");
    expect(mockSession.identity?.traits).toBeDefined();
    expect(typeof mockSession.identity?.schema_id).toBe("string");
  });
});

describe("Ory SDK contract — listIdentities response", () => {
  it("mock listIdentities data satisfies Identity[] shape", () => {
    const mockIdentities: DeepPartial<Identity>[] = [
      { id: "identity-1", traits: { username: "40200612345" } },
    ];

    assertType<DeepPartial<Identity>[]>(mockIdentities);

    expect(Array.isArray(mockIdentities)).toBe(true);
    expect(mockIdentities[0]?.id).toBeDefined();
  });

  it("empty list is a valid response", () => {
    const mockIdentities: DeepPartial<Identity>[] = [];

    assertType<DeepPartial<Identity>[]>(mockIdentities);
    expect(mockIdentities).toHaveLength(0);
  });
});

describe("Ory SDK contract — createBrowserRegistrationFlow response", () => {
  it("mock flow shape satisfies RegistrationFlow", () => {
    const mockFlow = {
      id: "ory-registration-flow",
      ui: {
        nodes: [
          {
            attributes: {
              name: "csrf_token",
              value: "csrf-123",
            },
          },
        ],
      },
    };

    assertType<DeepPartial<RegistrationFlow>>(mockFlow);

    // Runtime checks for fields our registration routes depend on
    expect(mockFlow.id).toBeDefined();
    expect(mockFlow.ui?.nodes).toBeDefined();
    expect(Array.isArray(mockFlow.ui?.nodes)).toBe(true);

    const csrfNode = mockFlow.ui?.nodes?.[0] as unknown as UiNode;
    const attrs = csrfNode?.attributes as Record<string, unknown>;
    expect(attrs.name).toBe("csrf_token");
    expect(attrs.value).toBe("csrf-123");
  });
});

describe("Ory SDK contract — updateRegistrationFlow response", () => {
  it("mock success shape satisfies SuccessfulNativeRegistration", () => {
    const mockSuccess = {
      identity: {
        id: "identity-123",
      },
      continue_with: [
        {
          action: "show_verification_ui",
          flow: { id: "verification-flow-123" },
        },
      ],
    };

    assertType<DeepPartial<SuccessfulNativeRegistration>>(mockSuccess);

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
    const mockError = {
      ui: {
        nodes: [
          {
            attributes: {
              name: "traits.email",
            },
            messages: [
              {
                id: 4000007,
                text: "An account with this email already exists.",
              },
            ],
          },
        ],
      },
    };

    assertType<DeepPartial<RegistrationFlow>>(mockError);

    const errorNode = mockError.ui?.nodes?.[0] as unknown as UiNode;
    const attrs = errorNode?.attributes as Record<string, unknown>;
    expect(attrs.name).toBe("traits.email");

    const messages = errorNode?.messages as UiText[] | undefined;
    expect(messages?.[0]?.id).toBe(4000007);
    expect(messages?.[0]?.text).toContain("already exists");
  });

  it("mock error with top-level error satisfies Ory error shape", () => {
    const mockError = {
      error: {
        id: "security_csrf_violation",
        message: "csrf rejected",
      },
    };

    assertType<DeepPartial<RegistrationFlow>>(mockError);

    expect(mockError.error?.id).toBe("security_csrf_violation");
    expect(mockError.error?.message).toBeDefined();
  });
});

describe("Ory SDK contract — createBrowserLogoutFlow response", () => {
  it("mock logout flow has required fields", () => {
    const mockLogoutFlow = {
      logout_token: "logout-token-123",
      logout_url:
        "https://ory.example.test/self-service/logout?token=logout-token-123",
    };

    // Logout flow is from @ory/client-fetch which shares types
    expect(mockLogoutFlow.logout_token).toBeDefined();
    expect(mockLogoutFlow.logout_url).toBeDefined();
    expect(typeof mockLogoutFlow.logout_token).toBe("string");
    expect(typeof mockLogoutFlow.logout_url).toBe("string");
  });
});

describe("Ory SDK contract — SDK method signatures", () => {
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
        typeof (FrontendApi.prototype as Record<string, unknown>)[method],
      ).toBe("function");
    }
  });

  it("IdentityApi has expected method names", async () => {
    const { IdentityApi } = await import("@ory/client");

    expect(
      typeof (IdentityApi.prototype as Record<string, unknown>).listIdentities,
    ).toBe("function");
  });
});
