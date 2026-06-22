import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetRegistrationSession,
  mockFindCitizenSummaryByCedula,
  mockGetRegistrationAccountDraft,
} = vi.hoisted(() => ({
  mockGetRegistrationSession: vi.fn(),
  mockFindCitizenSummaryByCedula: vi.fn(),
  mockGetRegistrationAccountDraft: vi.fn(),
}));

vi.mock("@/lib/services/registration/registration-session.service", () => ({
  getRegistrationSession: mockGetRegistrationSession,
}));

vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenSummaryByCedula: mockFindCitizenSummaryByCedula,
}));

vi.mock(
  "@/lib/services/registration/registration-account-draft.service",
  () => ({
    getRegistrationAccountDraft: mockGetRegistrationAccountDraft,
    isRegistrationAccountDraftForSession: (
      draft: { cedula: string; sessionId: string } | null,
      session: { cedula: string; sessionId: string },
    ) =>
      !!draft &&
      draft.sessionId === session.sessionId &&
      draft.cedula === session.cedula,
  }),
);

vi.mock("server-only", () => ({}));

import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";

describe("getRegistrationWizardState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRegistrationAccountDraft.mockResolvedValue(null);
  });

  it("returns step 0 when there is no registration session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 0,
      initialCedula: "",
      initialName: "",
      initialSessionStatus: null,
      hasAccountDraft: false,
    });
  });

  it("hydrates step 1 from an identified session when citizen data exists", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      status: "identified",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      firstName: "Juan",
    });

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 1,
      initialCedula: "00100063362",
      initialName: "Juan",
      initialSessionStatus: "identified",
      hasAccountDraft: false,
    });
    expect(mockFindCitizenSummaryByCedula).toHaveBeenCalledWith("00100063362");
  });

  it("hydrates step 2 from a verified session with an account draft", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "verified",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      firstName: "Juan",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
    });

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 2,
      initialCedula: "00100063362",
      initialName: "Juan",
      initialSessionStatus: "verified",
      hasAccountDraft: true,
    });
  });

  it("hydrates step 1 from a verified session when the draft belongs to another session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "verified",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      firstName: "Juan",
    });
    mockGetRegistrationAccountDraft.mockResolvedValueOnce({
      sessionId: "71e8e018-9b9f-4acf-af6e-3a7d781a771b",
      cedula: "00100063362",
      email: "user@example.com",
      password: "Password123!",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
    });

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 1,
      initialCedula: "00100063362",
      initialName: "Juan",
      initialSessionStatus: "verified",
      hasAccountDraft: false,
    });
  });

  it("hydrates step 1 from a verified session without a draft so account data can be re-entered", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      sessionId: "3f5e57bc-47d0-4f7d-9df8-c15f5bc7f92d",
      cedula: "00100063362",
      status: "verified",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      firstName: "Juan",
    });

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 1,
      initialCedula: "00100063362",
      initialName: "Juan",
      initialSessionStatus: "verified",
      hasAccountDraft: false,
    });
  });

  it("falls back to step 0 when the citizen has no first name", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      firstName: "",
    });

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 0,
      initialCedula: "",
      initialName: "",
      initialSessionStatus: null,
      hasAccountDraft: false,
    });
  });

  it("falls back to step 0 when citizen lookup throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
    });
    mockFindCitizenSummaryByCedula.mockRejectedValueOnce(new Error("boom"));

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 0,
      initialCedula: "",
      initialName: "",
      initialSessionStatus: null,
      hasAccountDraft: false,
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("falls back to step 0 when the session cedula is empty", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce(null);

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 0,
      initialCedula: "",
      initialName: "",
      initialSessionStatus: null,
      hasAccountDraft: false,
    });
    expect(mockFindCitizenSummaryByCedula).toHaveBeenCalledWith("");
  });
});
