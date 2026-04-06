import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetRegistrationSession, mockFindCitizenSummaryByCedula } =
  vi.hoisted(() => ({
    mockGetRegistrationSession: vi.fn(),
    mockFindCitizenSummaryByCedula: vi.fn(),
  }));

vi.mock("@/lib/services/registration/registration-session.service", () => ({
  getRegistrationSession: mockGetRegistrationSession,
}));

vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenSummaryByCedula: mockFindCitizenSummaryByCedula,
}));

vi.mock("server-only", () => ({}));

import { getRegistrationWizardState } from "@/lib/services/registration/registration-flow.service";

describe("getRegistrationWizardState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns step 0 when there is no registration session", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 0,
      initialName: "",
    });
  });

  it("hydrates step 1 from the real service when citizen data exists", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
    });
    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      firstName: "Juan",
    });

    await expect(getRegistrationWizardState()).resolves.toEqual({
      initialStep: 1,
      initialName: "Juan",
    });
    expect(mockFindCitizenSummaryByCedula).toHaveBeenCalledWith("00100063362");
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
      initialName: "",
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
      initialName: "",
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
      initialName: "",
    });
    expect(mockFindCitizenSummaryByCedula).toHaveBeenCalledWith("");
  });
});
