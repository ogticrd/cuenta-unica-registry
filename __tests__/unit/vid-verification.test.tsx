import assert from "node:assert/strict";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { VidVerification } from "@/components/auth/vid/vid-verification";

const { detector } = vi.hoisted(() => ({
  detector: vi.fn<(props: { onComplete: () => Promise<void> }) => void>(),
}));

vi.mock("@/hooks/use-t", () => ({
  useT: () =>
    Object.assign((key: string) => key, { rich: (key: string) => key }),
}));

vi.mock("@/lib/logging/client", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/components/auth/register/face-liveness-detector", () => ({
  FaceLivenessLoader: () => <div>Preparing camera</div>,
  FaceLiveness: (props: {
    sessionId: string;
    onComplete: () => Promise<void>;
  }) => {
    detector(props);
    return <div>{props.sessionId}</div>;
  },
}));

beforeEach(() => vi.clearAllMocks());

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
  expect(screen.getByRole("dialog")).toHaveClass("biometric-modal");
  const onComplete = detector.mock.lastCall?.[0].onComplete;
  assert.ok(onComplete);

  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByText("first")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

it("requires terms and keeps the biometric modal open while a challenge is being created", async () => {
  let finish: (value: Response) => void = () => {};
  const fetch = vi.fn().mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();
  render(<VidVerification flowId="test-flow" firstName="Test" />);
  expect(screen.getByRole("button", { name: "start" })).toBeDisabled();
  expect(fetch).not.toHaveBeenCalled();
  expect(
    screen.getByRole("img", { name: "verification.illustration_alt" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "start" }));
  expect(
    within(screen.getByRole("dialog")).getByRole("status"),
  ).toHaveTextContent("Preparing camera");
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await act(async () =>
    finish(Response.json({ success: true, sessionId: "ready" })),
  );
  expect(
    within(screen.getByRole("dialog")).getByText("ready"),
  ).toBeInTheDocument();
});

it("shows a retryable API error inside the biometric modal and starts another request on retry", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ success: false, code: "rekognition_error" }),
    )
    .mockResolvedValueOnce(
      Response.json({ success: true, sessionId: "retried" }),
    );
  vi.stubGlobal("fetch", fetch);
  const user = userEvent.setup();
  render(<VidVerification flowId="test-flow" firstName="Test" />);
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "start" }));
  const modal = within(screen.getByRole("dialog"));
  expect(await modal.findByRole("alert")).toHaveTextContent(
    "verification.rekognition_error",
  );
  await user.click(modal.getByRole("button", { name: "verification.retry" }));
  expect(await modal.findByText("retried")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("shows an expired flow as a page alert instead of reopening the camera modal", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ success: false, code: "flow_expired" }),
      ),
  );
  const user = userEvent.setup();
  render(<VidVerification flowId="test-flow" firstName="Test" />);
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "start" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "errors.flow_expired",
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
});
