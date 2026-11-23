import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validateCedula } from "@/lib/services/registration/cedula-validation.service";

const exception = "12345678901";
const api = "https://validation.example/v3/cedulas";

beforeEach(() => {
  vi.stubEnv("CEDULA_VALIDATION_API", api);
  vi.stubEnv("NEXT_PUBLIC_LUHN_EXCEPTION_HASHES", "");
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("server cedula validation", () => {
  it.each([
    "123",
    "123456789012",
    "00000000000",
    "11111111111",
    "abc12345678901",
  ])("rejects malformed or repeated digits without querying the API: %s", async (value) => {
    const fetchSpy = vi.spyOn(global, "fetch");
    expect(await validateCedula(value)).toEqual({
      success: false,
      code: "invalid_cedula",
      status: 400,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts Luhn without depending on the external API configuration", async () => {
    vi.stubEnv("CEDULA_VALIDATION_API", "");
    const fetchSpy = vi.spyOn(global, "fetch");
    expect(await validateCedula("402-0061234-5")).toEqual({ success: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps configured hash exceptions without querying the API", async () => {
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(exception),
    );
    vi.stubEnv(
      "NEXT_PUBLIC_LUHN_EXCEPTION_HASHES",
      Buffer.from(hash).toString("hex"),
    );
    const fetchSpy = vi.spyOn(global, "fetch");
    expect(await validateCedula(exception)).toEqual({ success: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts an API-confirmed exception with the normalized URL", async () => {
    vi.stubEnv("CEDULA_VALIDATION_API", `${api}/`);
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(Response.json({ valid: true }));
    expect(await validateCedula("123-4567890-1")).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      new URL(`${api}/${exception}/validate`),
      {
        cache: "no-store",
      },
    );
  });

  it("rejects a negative API result", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      Response.json({ valid: false }),
    );
    expect(await validateCedula(exception)).toEqual({
      success: false,
      code: "invalid_cedula",
      status: 400,
    });
  });

  it.each([
    {},
    { valid: "true" },
    null,
  ])("reports malformed API responses as unavailable: %j", async (payload) => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(Response.json(payload));
    expect(await validateCedula(exception)).toEqual({
      success: false,
      code: "cedula_validation_unavailable",
      status: 503,
    });
  });

  it.each([
    "network",
    "timeout",
    "http",
    "json",
    "configuration",
  ])("reports %s failures without leaking citizen data", async (failure) => {
    const fetchSpy = vi.spyOn(global, "fetch");
    if (failure === "configuration") vi.stubEnv("CEDULA_VALIDATION_API", "");
    else if (failure === "http")
      fetchSpy.mockResolvedValueOnce(
        Response.json({ error: exception }, { status: 503 }),
      );
    else if (failure === "json")
      fetchSpy.mockResolvedValueOnce(new Response("not-json"));
    else
      fetchSpy.mockRejectedValueOnce(
        new DOMException(
          exception,
          failure === "timeout" ? "TimeoutError" : "NetworkError",
        ),
      );
    expect(await validateCedula(exception)).toEqual({
      success: false,
      code: "cedula_validation_unavailable",
      status: 503,
    });
    expect(process.stdout.write).toHaveBeenCalled();
    const logged = JSON.stringify(vi.mocked(process.stdout.write).mock.calls);
    expect(logged).not.toContain(exception);
    expect(logged).not.toContain(api);
  });
});
