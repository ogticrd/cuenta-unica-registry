import { describe, expect, it } from "vitest";
import {
  type ApiResponseError,
  getCodedApiErrorPayload,
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
});
