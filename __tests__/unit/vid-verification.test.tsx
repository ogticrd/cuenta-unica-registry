import assert from "node:assert/strict";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { VidVerification } from "@/components/auth/vid/vid-verification";

const { detector } = vi.hoisted(() => ({
  detector: vi.fn<(props: { onComplete: () => Promise<void> }) => void>(),
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () =>
    Object.assign((key: string) => key, { rich: (key: string) => key }),
}));

vi.mock("@/components/auth/register/face-liveness-detector", () => ({
  FaceLiveness: (props: {
    sessionId: string;
    onComplete: () => Promise<void>;
  }) => {
    detector(props);
    return <div>{props.sessionId}</div>;
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

it("returns from a cancelled capture and starts a fresh challenge on retry", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ success: true, sessionId: "first" }))
    .mockResolvedValueOnce(
      Response.json({ success: true, sessionId: "second" }),
    );
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();

  render(<VidVerification flowId="test-flow" firstName="Test" />);
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "start" }));
  await screen.findByText("first");
  const onComplete = detector.mock.lastCall?.[0].onComplete;
  assert.ok(onComplete);

  await user.click(
    screen.getByRole("button", { name: "verification.liveness.cancel_button" }),
  );
  expect(screen.queryByText("first")).not.toBeInTheDocument();
  await act(onComplete);
  expect(fetch).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "start" }));
  await screen.findByText("second");
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/vid/liveness",
    expect.objectContaining({
      body: JSON.stringify({
        stage: "start",
        flowId: "test-flow",
        retry: true,
      }),
    }),
  );
});
