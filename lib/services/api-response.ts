import type { z } from "zod";

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

type JsonRequestFailure<TFieldErrors> = {
  success: false;
  code: "invalid_payload";
  fieldErrors?: TFieldErrors;
};

type JsonRequestOptions<TSchema extends z.ZodType, TFieldErrors> = {
  getFieldErrors?: (error: z.ZodError<z.input<TSchema>>) => TFieldErrors;
};

const INVALID_JSON_BODY = Symbol("invalid_json_body");

export type JsonRequestParseResult<TData, TFieldErrors> =
  | {
      success: true;
      data: TData;
    }
  | JsonRequestFailure<TFieldErrors>;

export type OptionalJsonRequestParseResult<TData, TFieldErrors> =
  | {
      success: true;
      data: TData | null;
    }
  | JsonRequestFailure<TFieldErrors>;

function createInvalidPayloadResult<TFieldErrors>(
  fieldErrors?: TFieldErrors,
): JsonRequestFailure<TFieldErrors> {
  return {
    success: false,
    code: "invalid_payload",
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

function parseSchema<TSchema extends z.ZodType, TFieldErrors>(
  body: unknown,
  schema: TSchema,
  options?: JsonRequestOptions<TSchema, TFieldErrors>,
): JsonRequestParseResult<z.output<TSchema>, TFieldErrors> {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return createInvalidPayloadResult(
      options?.getFieldErrors?.(parsed.error as z.ZodError<z.input<TSchema>>),
    );
  }

  return {
    success: true,
    data: parsed.data,
  };
}

export async function parseJsonRequest<
  TSchema extends z.ZodType,
  TFieldErrors = never,
>(
  request: Request,
  schema: TSchema,
  options?: JsonRequestOptions<TSchema, TFieldErrors>,
): Promise<JsonRequestParseResult<z.output<TSchema>, TFieldErrors>> {
  const body = await request.json().catch(() => INVALID_JSON_BODY);

  if (body === INVALID_JSON_BODY) {
    return createInvalidPayloadResult();
  }

  return parseSchema(body, schema, options);
}

export async function parseOptionalJsonRequest<
  TSchema extends z.ZodType,
  TFieldErrors = never,
>(
  request: Request,
  schema: TSchema,
  options?: JsonRequestOptions<TSchema, TFieldErrors>,
): Promise<OptionalJsonRequestParseResult<z.output<TSchema>, TFieldErrors>> {
  const rawBody = await request.text().catch(() => null);

  if (rawBody === null) {
    return createInvalidPayloadResult();
  }

  if (!rawBody.trim()) {
    return {
      success: true,
      data: null,
    };
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return createInvalidPayloadResult();
  }

  return parseSchema(body, schema, options);
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

export function getCodedApiErrorPayload<
  TPayload extends { success: false; code: string },
>(error: unknown): TPayload | null {
  if (
    error instanceof ApiResponseError &&
    error.payload?.success === false &&
    typeof error.payload.code === "string" &&
    error.payload.code !== "invalid_json"
  ) {
    return error.payload as TPayload;
  }

  return null;
}

export function isExpectedCodedApiError(error: unknown) {
  return getCodedApiErrorPayload(error) !== null;
}

export function logUnexpectedApiError(context: string, error: unknown) {
  if (!isExpectedCodedApiError(error)) {
    console.error(`${context} Request failed:`, error);
  }
}
