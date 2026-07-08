import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import {
  createBiometricStateCookie,
  getBiometricState,
  prepareBiometricAttempt,
  recordBiometricSessionCreated,
} from '@/common/helpers/biometric-state';
import {
  parseBiometricSource,
  resolveBiometricSubject,
} from '@/common/helpers/biometric-request';
import { getRekognitionClient } from '@/common/helpers/rekognition';
import {
  BIOMETRIC_ERROR_MESSAGE_KEY_BY_CODE,
  type BiometricErrorCode,
  type BiometricFailureResponse,
} from '@/common/biometric-contract';

type CreateBiometricSessionPayload = {
  source?: string;
  flowId?: string;
  forceNew?: boolean;
};

function isCreateBiometricSessionPayload(
  value: unknown,
): value is CreateBiometricSessionPayload {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function createFailureBody(
  code: BiometricErrorCode,
  retryAfterSeconds?: number,
): BiometricFailureResponse {
  return {
    success: false,
    code,
    message: BIOMETRIC_ERROR_MESSAGE_KEY_BY_CODE[code],
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

export async function POST(req: NextRequest) {
  const rawPayload = await req.json().catch(() => null);
  const payload = isCreateBiometricSessionPayload(rawPayload)
    ? rawPayload
    : {};
  const source = parseBiometricSource(payload.source);

  if (!source) {
    return NextResponse.json(
      createFailureBody('invalid_liveness_session'),
      { status: 400 },
    );
  }

  const subject = await resolveBiometricSubject({
    source,
    flowId: typeof payload.flowId === 'string' ? payload.flowId : undefined,
  });

  if (!subject) {
    return NextResponse.json(
      createFailureBody('invalid_liveness_session'),
      { status: 400 },
    );
  }

  const currentState = await getBiometricState();
  const attempt = prepareBiometricAttempt({
    state: currentState,
    subject,
    forceNew: payload.forceNew === true,
  });

  if (attempt.status === 'blocked') {
    const response = NextResponse.json(
      createFailureBody(attempt.code, attempt.retryAfterSeconds),
      { status: 429 },
    );

    response.cookies.set(createBiometricStateCookie(attempt.state));
    Sentry.captureMessage('biometric_liveness_session_blocked', {
      level: 'warning',
      tags: { source, code: attempt.code },
      extra: { retryAfterSeconds: attempt.retryAfterSeconds },
    });

    return response;
  }

  if (attempt.status === 'reuse') {
    const response = NextResponse.json({
      success: true,
      sessionId: attempt.sessionId,
    });

    response.cookies.set(createBiometricStateCookie(attempt.state));

    return response;
  }

  try {
    const client = await getRekognitionClient(req);

    const { SessionId: sessionId } = await client.createFaceLivenessSession({
      ClientRequestToken: attempt.clientRequestToken,
    });

    if (!sessionId) {
      throw new Error('Rekognition did not return a SessionId');
    }

    const nextState = recordBiometricSessionCreated({
      state: attempt.state,
      sessionId,
      clientRequestToken: attempt.clientRequestToken,
      attemptNumber: attempt.attemptNumber,
    });
    const response = NextResponse.json({ success: true, sessionId });

    response.cookies.set(createBiometricStateCookie(nextState));
    Sentry.captureMessage('rekognition_liveness_session_created', {
      level: 'info',
      tags: { source },
      extra: { attemptNumber: attempt.attemptNumber },
    });

    return response;
  } catch (error) {
    Sentry.captureMessage('biometric_liveness_session_create_failed', {
      level: 'error',
      tags: { source, code: 'rekognition_error' },
      extra: { errorName: getSafeErrorName(error) },
    });

    return NextResponse.json(
      createFailureBody('rekognition_error'),
      { status: 502 },
    );
  }
}
