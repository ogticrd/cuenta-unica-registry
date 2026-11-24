import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserFeedbackModal } from "@/components/feedback/user-feedback-modal";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import {
  type FeedbackResult,
  submitFeedback,
} from "@/lib/services/feedback/feedback.service";

const locale = vi.hoisted(() => ({ value: "es" as "es" | "en" }));
vi.mock("@/hooks/use-t", () => ({
  useT: () => (key: keyof typeof es.feedback) =>
    ({ es, en })[locale.value].feedback[key],
}));
vi.mock("@/lib/services/feedback/feedback.service", () => ({
  submitFeedback: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  locale.value = "es";
  vi.stubEnv("NEXT_PUBLIC_WHATSAPP_SUPPORT_PHONE", "+1-809-718-1459");
});
afterEach(() => vi.unstubAllEnvs());

async function fillFeedback() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Número de cédula/), "40200612345");
  await user.type(
    screen.getByLabelText(/Correo electrónico/),
    "test@example.com",
  );
  await user.type(
    screen.getByLabelText(/Comentarios/),
    "Necesito ayuda con mi cuenta",
  );
  return user;
}

describe("feedback modal", () => {
  it.each([
    "es",
    "en",
  ] as const)("offers localized WhatsApp help in %s without copying form data", (language) => {
    locale.value = language;
    render(<UserFeedbackModal open onClose={vi.fn()} />);
    const text = { es, en }[language].feedback;
    const link = screen.getByRole("link", { name: text.whatsapp_help });
    const url = new URL(link.getAttribute("href") ?? "");
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/18097181459");
    expect(url.searchParams.get("text")).toBe(text.whatsapp_message);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows progress, prevents dismissal and duplicate submissions, and clears successful feedback", async () => {
    let finish: (result: FeedbackResult) => void = () => {};
    vi.mocked(submitFeedback).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const close = vi.fn();
    render(<UserFeedbackModal open onClose={close} />);
    const user = await fillFeedback();
    await user.click(screen.getByRole("button", { name: es.feedback.report }));
    expect(
      await screen.findByRole("button", { name: es.feedback.sending }),
    ).toBeDisabled();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(close).not.toHaveBeenCalled();
    expect(submitFeedback).toHaveBeenCalledTimes(1);
    await act(async () => finish({ success: true }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      es.feedback.sent,
    );
    expect(screen.getByLabelText(/Número de cédula/)).toHaveValue("");
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue("");
    expect(screen.getByLabelText(/Comentarios/)).toHaveValue("");
  });

  it.each([
    "SERVER_ERROR",
    "NOT_CONFIGURED",
  ] as const)("retains the form and allows retry after %s", async (code) => {
    vi.mocked(submitFeedback)
      .mockResolvedValueOnce({ success: false, code })
      .mockResolvedValueOnce({ success: true });
    render(<UserFeedbackModal open onClose={vi.fn()} />);
    const user = await fillFeedback();
    await user.click(screen.getByRole("button", { name: es.feedback.report }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      code === "NOT_CONFIGURED"
        ? es.feedback.unavailable
        : es.feedback.send_error,
    );
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByLabelText(/Comentarios/)).toHaveValue(
      "Necesito ayuda con mi cuenta",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: es.feedback.report }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: es.feedback.report }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      es.feedback.sent,
    );
  });
});
