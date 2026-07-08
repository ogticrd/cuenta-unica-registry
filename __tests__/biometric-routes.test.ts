import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestCookies, mockCookies } = vi.hoisted(() => ({
  requestCookies: new Map<string, string>(),
  mockCookies: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@/common/helpers/rekognition', () => ({
  getRekognitionClient: vi.fn(),
}));

import { POST as postBiometricSession } from '@/app/api/biometric/route';
import { GET as getBiometricResult } from '@/app/api/biometric/[sessionId]/[cedula]/route';
import { BIOMETRIC_STATE_COOKIE } from '@/common/helpers/biometric-state';
import { getRekognitionClient } from '@/common/helpers/rekognition';

const TEST_CEDULA = '40200612345';
const mockGetRekognitionClient = vi.mocked(getRekognitionClient);
type RekognitionClient = Awaited<ReturnType<typeof getRekognitionClient>>;

function mockRekognitionClient(client: Partial<RekognitionClient>) {
  mockGetRekognitionClient.mockResolvedValue(client as RekognitionClient);
}

function encodeCookiePayload(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function setRequestCookies(cookies: Record<string, string>) {
  requestCookies.clear();

  for (const [name, value] of Object.entries(cookies)) {
    requestCookies.set(name, value);
  }
}

function createPostRequest(forceNew = false) {
  return new NextRequest('http://localhost/api/biometric', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'registration', forceNew }),
  });
}

function createResultRequest(sessionId: string, cedula = TEST_CEDULA) {
  return new NextRequest(
    `http://localhost/api/biometric/${sessionId}/${cedula}?source=registration`,
  );
}

function applyBiometricCookie(response: Response) {
  const cookie = Reflect.get(response, 'cookies')?.get(BIOMETRIC_STATE_COOKIE);

  if (cookie?.value) {
    requestCookies.set(BIOMETRIC_STATE_COOKIE, cookie.value);
  }
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  process.env.SITE_COOKIE_KEY = 'test-site-cookie-key';
  process.env.BIOMETRIC_MAX_ATTEMPTS = '3';
  process.env.BIOMETRIC_COOLDOWN_SECONDS = '900';
  process.env.BIOMETRIC_STATE_TTL_SECONDS = '1800';
  process.env.LIVENESS_CONFIDENCE_THRESHOLD = 85;
  process.env.LIVENESS_SIMILARITY_THRESHOLD = 95;
  process.env.JCE_PHOTO_API = 'https://jce.example.test';
  process.env.JCE_PHOTO_API_KEY = 'test-key';
  setRequestCookies({
    citizen: encodeCookiePayload({ id: TEST_CEDULA, name: 'Ana' }),
  });

  mockCookies.mockResolvedValue({
    get(name: string) {
      const value = requestCookies.get(name);
      return value ? { name, value } : undefined;
    },
  });
});

describe('biometric API routes', () => {
  it('creates a liveness session with an idempotent client request token', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
    };
    mockRekognitionClient(client);

    const response = await postBiometricSession(createPostRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, sessionId: 'session-1' });
    expect(client.createFaceLivenessSession).toHaveBeenCalledWith({
      ClientRequestToken: expect.stringMatching(/^[A-Za-z0-9-_]{1,64}$/),
    });
  });

  it('blocks new liveness sessions after the configured attempt limit', async () => {
    const client = {
      createFaceLivenessSession: vi
        .fn()
        .mockResolvedValueOnce({ SessionId: 'session-1' })
        .mockResolvedValueOnce({ SessionId: 'session-2' })
        .mockResolvedValueOnce({ SessionId: 'session-3' }),
    };
    mockRekognitionClient(client);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await postBiometricSession(createPostRequest(true));
      expect(response.status).toBe(200);
      applyBiometricCookie(response);
    }

    const blockedResponse = await postBiometricSession(createPostRequest(true));
    const body = await blockedResponse.json();

    expect(blockedResponse.status).toBe(429);
    expect(body).toMatchObject({
      success: false,
      code: 'biometric_attempt_limit_exceeded',
      retryAfterSeconds: 900,
    });
    expect(client.createFaceLivenessSession).toHaveBeenCalledTimes(3);
  });

  it('keeps cooldown active and creates a new attempt window after it expires', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T10:00:00.000Z'));
    process.env.BIOMETRIC_MAX_ATTEMPTS = '1';
    process.env.BIOMETRIC_COOLDOWN_SECONDS = '60';

    const client = {
      createFaceLivenessSession: vi
        .fn()
        .mockResolvedValueOnce({ SessionId: 'session-1' })
        .mockResolvedValueOnce({ SessionId: 'session-2' }),
    };
    mockRekognitionClient(client);

    const firstResponse = await postBiometricSession(createPostRequest(true));
    applyBiometricCookie(firstResponse);

    const limitResponse = await postBiometricSession(createPostRequest(true));
    const limitBody = await limitResponse.json();
    applyBiometricCookie(limitResponse);

    expect(limitResponse.status).toBe(429);
    expect(limitBody).toMatchObject({
      success: false,
      code: 'biometric_attempt_limit_exceeded',
      retryAfterSeconds: 60,
    });

    vi.setSystemTime(new Date('2026-07-07T10:00:30.000Z'));

    const cooldownResponse = await postBiometricSession(createPostRequest(true));
    const cooldownBody = await cooldownResponse.json();
    applyBiometricCookie(cooldownResponse);

    expect(cooldownResponse.status).toBe(429);
    expect(cooldownBody).toMatchObject({
      success: false,
      code: 'biometric_cooldown_active',
      retryAfterSeconds: 30,
    });
    expect(client.createFaceLivenessSession).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-07-07T10:01:01.000Z'));

    const retryResponse = await postBiometricSession(createPostRequest(true));
    const retryBody = await retryResponse.json();

    expect(retryResponse.status).toBe(200);
    expect(retryBody).toEqual({ success: true, sessionId: 'session-2' });
    expect(client.createFaceLivenessSession).toHaveBeenCalledTimes(2);
  });

  it('reuses the active liveness session when retrying without forcing a new attempt', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
    };
    mockRekognitionClient(client);

    const firstResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(firstResponse);

    const retryResponse = await postBiometricSession(createPostRequest());
    const body = await retryResponse.json();

    expect(retryResponse.status).toBe(200);
    expect(body).toEqual({ success: true, sessionId: 'session-1' });
    expect(client.createFaceLivenessSession).toHaveBeenCalledTimes(1);
  });

  it('rejects liveness results that are not bound to the active challenge', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi.fn(),
    };
    mockRekognitionClient(client);

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(createResultRequest('other'), {
      params: Promise.resolve({ sessionId: 'other', cedula: TEST_CEDULA }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      code: 'invalid_liveness_session',
    });
    expect(client.getFaceLivenessSessionResults).not.toHaveBeenCalled();
  });

  it('rejects liveness results when the cedula URL does not match server state', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi.fn(),
    };
    mockRekognitionClient(client);

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(
      createResultRequest('session-1', '00112345678'),
      {
        params: Promise.resolve({
          sessionId: 'session-1',
          cedula: '00112345678',
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      code: 'invalid_liveness_session',
    });
    expect(client.getFaceLivenessSessionResults).not.toHaveBeenCalled();
  });

  it('returns a stable code when liveness confidence is too low', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi.fn().mockResolvedValue({
        Confidence: 40,
        ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
      }),
      compareFaces: vi.fn(),
    };
    mockRekognitionClient(client);

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(
      createResultRequest('session-1'),
      {
        params: Promise.resolve({
          sessionId: 'session-1',
          cedula: TEST_CEDULA,
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      success: false,
      code: 'liveness_low_confidence',
    });
    expect(client.compareFaces).not.toHaveBeenCalled();
  });

  it('returns a stable code when the JCE photo is unavailable', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi.fn().mockResolvedValue({
        Confidence: 99,
        ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
      }),
      compareFaces: vi.fn(),
    };
    mockRekognitionClient(client);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(
      createResultRequest('session-1'),
      {
        params: Promise.resolve({
          sessionId: 'session-1',
          cedula: TEST_CEDULA,
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      success: false,
      code: 'jce_photo_unavailable',
    });
    expect(client.compareFaces).not.toHaveBeenCalled();
  });

  it('returns a stable code when Rekognition result lookup fails', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi
        .fn()
        .mockRejectedValue(new Error('rekognition down')),
    };
    mockRekognitionClient(client);

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(
      createResultRequest('session-1'),
      {
        params: Promise.resolve({
          sessionId: 'session-1',
          cedula: TEST_CEDULA,
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      success: false,
      code: 'rekognition_error',
    });
  });

  it('returns a stable code when face match fails', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi.fn().mockResolvedValue({
        Confidence: 99,
        ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
      }),
      compareFaces: vi.fn().mockResolvedValue({
        FaceMatches: [],
      }),
    };
    mockRekognitionClient(client);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(new Uint8Array([4, 5, 6]))),
    );

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(
      createResultRequest('session-1'),
      {
        params: Promise.resolve({
          sessionId: 'session-1',
          cedula: TEST_CEDULA,
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      success: false,
      code: 'face_mismatch',
    });
    expect(client.compareFaces).toHaveBeenCalledTimes(1);
  });

  it('marks biometric verification as completed after liveness and face match pass', async () => {
    const client = {
      createFaceLivenessSession: vi.fn().mockResolvedValue({
        SessionId: 'session-1',
      }),
      getFaceLivenessSessionResults: vi.fn().mockResolvedValue({
        Confidence: 99,
        ReferenceImage: { Bytes: new Uint8Array([1, 2, 3]) },
      }),
      compareFaces: vi.fn().mockResolvedValue({
        FaceMatches: [{ Similarity: 99 }],
      }),
    };
    mockRekognitionClient(client);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(new Uint8Array([4, 5, 6]))),
    );

    const createResponse = await postBiometricSession(createPostRequest());
    applyBiometricCookie(createResponse);

    const response = await getBiometricResult(
      createResultRequest('session-1'),
      {
        params: Promise.resolve({
          sessionId: 'session-1',
          cedula: TEST_CEDULA,
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      isMatch: true,
      confidence: 99,
      similarity: 99,
    });
    expect(client.compareFaces).toHaveBeenCalledTimes(1);
  });
});
