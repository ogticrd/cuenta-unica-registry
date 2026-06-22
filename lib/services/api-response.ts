export type ApiErrorPayload = {
  code?: string;
  error?: string;
  success?: false;
  [key: string]: unknown;
};

export class ApiResponseError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(payload?.code ?? `Request failed with status ${status}`);
    this.name = "ApiResponseError";
    this.status = status;
    this.code = payload?.code;
    this.payload = payload;
  }
}

function createInvalidJsonPayload(): ApiErrorPayload {
  return {
    success: false,
    code: "invalid_json",
    error: "invalid_json",
  };
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | null;

  if (payload === null) {
    throw new ApiResponseError(response.status, createInvalidJsonPayload());
  }

  if (!response.ok) {
    throw new ApiResponseError(response.status, payload as ApiErrorPayload);
  }

  return payload;
}
