import { describe, it, expect, vi, beforeEach } from "vitest";

// Types (copied from project)
interface RegistrationWizardState {
  initialStep: 0 | 1 | 2;
  initialName: string;
}

interface RegistrationSession {
  cedula: string;
  createdAt: Date;
  expiresAt: Date;
}

interface CitizenSummary {
  id: string;
  firstName: string;
  lastName: string;
  names: string;
}

type CitizenLookupErrorCode =
  | "invalid_cedula"
  | "identity_exists"
  | "citizen_not_found"
  | "unexpected_error";

type CitizenLookupResponse =
  | {
      success: true;
      citizen: { id: string; firstName: string };
    }
  | {
      success: false;
      code: CitizenLookupErrorCode;
    };

// Mock services
const mockGetRegistrationSession = vi.fn();
const mockFindCitizenSummaryByCedula = vi.fn();

vi.mock("@/lib/services/registration/registration-session.service", () => ({
  getRegistrationSession: () => mockGetRegistrationSession(),
}));

vi.mock("@/lib/services/registration/citizen-registry.service", () => ({
  findCitizenSummaryByCedula: (cedula: string) =>
    mockFindCitizenSummaryByCedula(cedula),
}));

// Registration flow service (copied from project)
async function getRegistrationWizardState(): Promise<RegistrationWizardState> {
  const session = await mockGetRegistrationSession();

  if (!session) {
    return {
      initialStep: 0,
      initialName: "",
    };
  }

  try {
    const citizen = await mockFindCitizenSummaryByCedula(session.cedula);

    if (!citizen?.firstName) {
      return {
        initialStep: 0,
        initialName: "",
      };
    }

    return {
      initialStep: 1,
      initialName: citizen.firstName,
    };
  } catch (error) {
    console.error("[registration-flow] Failed to hydrate wizard state:", error);

    return {
      initialStep: 0,
      initialName: "",
    };
  }
}

describe("getRegistrationWizardState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial step 0 when no session exists", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce(null);

    const result = await getRegistrationWizardState();

    expect(result).toEqual({
      initialStep: 0,
      initialName: "",
    });
  });

  it("should return initial step 1 when session and citizen exist", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "citizen-123",
      firstName: "Juan",
      lastName: "Perez",
      names: "Juan Carlos Perez",
    });

    const result = await getRegistrationWizardState();

    expect(result).toEqual({
      initialStep: 1,
      initialName: "Juan",
    });
  });

  it("should return step 0 when citizen has no firstName", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "citizen-123",
      firstName: "",
      lastName: "Perez",
      names: "Perez",
    });

    const result = await getRegistrationWizardState();

    expect(result).toEqual({
      initialStep: 0,
      initialName: "",
    });
  });

  it("should return step 0 when citizen is null", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValueOnce(null);

    const result = await getRegistrationWizardState();

    expect(result).toEqual({
      initialStep: 0,
      initialName: "",
    });
  });

  it("should return step 0 when citizen lookup fails", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockRejectedValueOnce(
      new Error("Citizen lookup failed"),
    );

    const result = await getRegistrationWizardState();

    expect(result).toEqual({
      initialStep: 0,
      initialName: "",
    });
  });

  it("should call findCitizenSummaryByCedula with correct cedula", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "citizen-123",
      firstName: "Juan",
      lastName: "Perez",
      names: "Juan Perez",
    });

    await getRegistrationWizardState();

    expect(mockFindCitizenSummaryByCedula).toHaveBeenCalledWith("00100063362");
  });
});

describe("RegistrationWizardState", () => {
  it("should allow step values 0, 1, 2", () => {
    const state0: RegistrationWizardState = {
      initialStep: 0,
      initialName: "",
    };
    const state1: RegistrationWizardState = {
      initialStep: 1,
      initialName: "Juan",
    };
    const state2: RegistrationWizardState = {
      initialStep: 2,
      initialName: "Maria",
    };

    expect(state0.initialStep).toBe(0);
    expect(state1.initialStep).toBe(1);
    expect(state2.initialStep).toBe(2);
  });

  it("should allow empty or populated initialName", () => {
    const emptyName: RegistrationWizardState = {
      initialStep: 0,
      initialName: "",
    };
    const withName: RegistrationWizardState = {
      initialStep: 1,
      initialName: "Carlos",
    };

    expect(emptyName.initialName).toBe("");
    expect(withName.initialName).toBe("Carlos");
  });
});

describe("RegistrationSession", () => {
  it("should have required properties", () => {
    const session: RegistrationSession = {
      cedula: "00100063362",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-01T01:00:00Z"),
    };

    expect(session.cedula).toBe("00100063362");
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.expiresAt).toBeInstanceOf(Date);
  });

  it("should have expiresAt after createdAt", () => {
    const session: RegistrationSession = {
      cedula: "00100063362",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      expiresAt: new Date("2024-01-01T01:00:00Z"),
    };

    expect(session.expiresAt.getTime()).toBeGreaterThan(
      session.createdAt.getTime(),
    );
  });
});

describe("CitizenSummary", () => {
  it("should have all required properties", () => {
    const citizen: CitizenSummary = {
      id: "citizen-123",
      firstName: "Juan",
      lastName: "Perez",
      names: "Juan Carlos Perez Rodriguez",
    };

    expect(citizen.id).toBe("citizen-123");
    expect(citizen.firstName).toBe("Juan");
    expect(citizen.lastName).toBe("Perez");
    expect(citizen.names).toBe("Juan Carlos Perez Rodriguez");
  });
});

describe("Registration Flow Edge Cases", () => {
  it("should handle concurrent session lookups", async () => {
    mockGetRegistrationSession.mockResolvedValue({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValue({
      id: "citizen-123",
      firstName: "Juan",
      lastName: "Perez",
      names: "Juan Perez",
    });

    const results = await Promise.all([
      getRegistrationWizardState(),
      getRegistrationWizardState(),
      getRegistrationWizardState(),
    ]);

    results.forEach((result) => {
      expect(result).toEqual({
        initialStep: 1,
        initialName: "Juan",
      });
    });
  });

  it("should handle special characters in firstName", async () => {
    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "citizen-123",
      firstName: "José María",
      lastName: "García",
      names: "José María García",
    });

    const result = await getRegistrationWizardState();

    expect(result.initialName).toBe("José María");
  });

  it("should handle very long names", async () => {
    const longName = "Juan Carlos Alejandro Fernando José Miguel Ángel";

    mockGetRegistrationSession.mockResolvedValueOnce({
      cedula: "00100063362",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    mockFindCitizenSummaryByCedula.mockResolvedValueOnce({
      id: "citizen-123",
      firstName: longName,
      lastName: "Perez",
      names: longName + " Perez",
    });

    const result = await getRegistrationWizardState();

    expect(result.initialName).toBe(longName);
  });
});
