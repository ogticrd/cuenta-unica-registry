import { describe, expect, it, vi } from "vitest";
import {
  type ApiResponseError,
  getCodedApiErrorPayload,
  isExpectedCodedApiError,
  logUnexpectedApiError,
  parseJsonResponse,
} from "@/lib/services/api-response";

describe("parseJsonResponse", () => {
  it("returns parsed JSON for successful responses", async () => {
    const response = new Response(JSON.stringify({ success: true }), {
      status: 200,
    });

    await expect(parseJsonResponse(response)).resolves.toEqual({
      success: true,
    });
  });

  it("throws a coded API error for non-OK responses", async () => {
    const response = new Response(
      JSON.stringify({
        success: false,
        code: "notifications_unavailable",
        error: "notifications_unavailable",
      }),
      { status: 503 },
    );

    await expect(parseJsonResponse(response)).rejects.toMatchObject({
      name: "ApiResponseError",
      status: 503,
      code: "notifications_unavailable",
      payload: {
        success: false,
        code: "notifications_unavailable",
        error: "notifications_unavailable",
      },
    } satisfies Partial<ApiResponseError>);
  });

  it("throws invalid_json when the response body is not valid JSON", async () => {
    const response = new Response("not-json", { status: 200 });

    await expect(parseJsonResponse(response)).rejects.toMatchObject({
      name: "ApiResponseError",
      status: 200,
      code: "invalid_json",
      payload: {
        success: false,
        code: "invalid_json",
        error: "invalid_json",
      },
    } satisfies Partial<ApiResponseError>);
  });

  it("throws invalid_json when the response body is null", async () => {
    const response = new Response("null", { status: 200 });

    await expect(parseJsonResponse(response)).rejects.toMatchObject({
      name: "ApiResponseError",
      status: 200,
      code: "invalid_json",
    } satisfies Partial<ApiResponseError>);
  });

  it("extracts coded API error payloads and ignores invalid JSON failures", async () => {
    const response = new Response(
      JSON.stringify({
        success: false,
        code: "registration_session_missing",
      }),
      { status: 401 },
    );

    const error = await parseJsonResponse(response).catch((err) => err);

    expect(getCodedApiErrorPayload(error)).toEqual({
      success: false,
      code: "registration_session_missing",
    });

    const invalidJsonError = await parseJsonResponse(
      new Response("not-json", { status: 500 }),
    ).catch((err) => err);

    expect(getCodedApiErrorPayload(invalidJsonError)).toBeNull();
  });

  it("identifies coded API errors as expected client-side failures", async () => {
    const codedError = await parseJsonResponse(
      new Response(
        JSON.stringify({
          success: false,
          code: "invalid_payload",
        }),
        { status: 400 },
      ),
    ).catch((err) => err);
    const invalidJsonError = await parseJsonResponse(
      new Response("not-json", { status: 400 }),
    ).catch((err) => err);

    expect(isExpectedCodedApiError(codedError)).toBe(true);
    expect(isExpectedCodedApiError(invalidJsonError)).toBe(false);
    expect(isExpectedCodedApiError(new Error("offline"))).toBe(false);
  });

  it("logs only unexpected API failures", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const codedError = await parseJsonResponse(
      new Response(
        JSON.stringify({
          success: false,
          code: "invalid_payload",
        }),
        { status: 400 },
      ),
    ).catch((err) => err);
    const offlineError = new Error("offline");

    logUnexpectedApiError("[testService.operation]", codedError);
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    logUnexpectedApiError("[testService.operation]", offlineError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[testService.operation] Request failed:",
      offlineError,
    );
  });
});
