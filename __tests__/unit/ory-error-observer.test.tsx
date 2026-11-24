import { render, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { OryErrorObserver } from "@/components/auth/ory-error-observer";
import { reportClientError } from "@/lib/logging/client";

beforeEach(() => vi.clearAllMocks());

it("reports error IDs without copying Ory flow values or user data", async () => {
  render(
    <OryErrorObserver
      form="verification"
      flow={{
        id: "private-flow",
        ui: {
          messages: [{ id: 4000001, type: "error", text: "test@example.com" }],
          nodes: [
            {
              attributes: { name: "code", value: "123456" },
              messages: [{ id: 4000002, type: "error" }],
            },
          ],
        },
      }}
    />,
  );
  await waitFor(() =>
    expect(reportClientError).toHaveBeenCalledWith("form_error", {
      form: "verification",
      code: "ory_validation_error",
      messageIds: [4000001, 4000002],
    }),
  );
  const reported = JSON.stringify(vi.mocked(reportClientError).mock.calls);
  expect(reported).not.toContain("private-flow");
  expect(reported).not.toContain("test@example.com");
  expect(reported).not.toContain("123456");
});

it("does not treat a normal Ory form or information message as an error", () => {
  render(
    <OryErrorObserver
      form="login"
      flow={{
        ui: {
          messages: [{ id: 1000001, type: "info" }],
          nodes: [{ messages: [] }],
        },
      }}
    />,
  );
  expect(reportClientError).not.toHaveBeenCalled();
});
