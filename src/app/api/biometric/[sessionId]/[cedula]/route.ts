import type {
  CompareFacesCommandInput,
  GetFaceLivenessSessionResultsCommandOutput,
  Rekognition,
} from '@aws-sdk/client-rekognition';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import {
  createBiometricStateCookie,
  getBiometricState,
  isBiometricChallengeValid,
  recordBiometricFailure,
  recordBiometricSuccess,
  type BiometricState,
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

type Props = { params: Promise<{ sessionId: string; cedula: string }> };

function createErrorResponse({
  code,
  status,
  state,
}: {
  code: BiometricErrorCode;
  status: number;
  state?: BiometricState;
}) {
  const body: BiometricFailureResponse = {
    success: false,
    code,
    message: BIOMETRIC_ERROR_MESSAGE_KEY_BY_CODE[code],
  };
  const response = NextResponse.json(
    body,
    { status },
  );

  if (state) {
    response.cookies.set(createBiometricStateCookie(state));
  }

  return response;
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

export async function GET(req: NextRequest, { params }: Props) {
  const { sessionId, cedula } = await params;
  const source = parseBiometricSource(req.nextUrl.searchParams.get('source'));
  const flowId = req.nextUrl.searchParams.get('flowId') ?? undefined;

  if (!source) {
    return createErrorResponse({
      code: 'invalid_liveness_session',
      status: 400,
    });
  }

  const subject = await resolveBiometricSubject({
    source,
    flowId,
    cedulaFromPath: cedula,
  });

  if (!subject) {
    return createErrorResponse({
      code: 'invalid_liveness_session',
      status: 400,
    });
  }

  const biometricState = await getBiometricState();

  if (
    !biometricState ||
    !isBiometricChallengeValid({
      state: biometricState,
      subject,
      sessionId,
    })
  ) {
    return createErrorResponse({
      code: 'invalid_liveness_session',
      status: 400,
    });
  }

  const activeBiometricState = biometricState;

  let client: Rekognition;
  let response: GetFaceLivenessSessionResultsCommandOutput;

  try {
    client = await getRekognitionClient(req);
    response = await client.getFaceLivenessSessionResults({
      SessionId: sessionId,
    });
  } catch (error) {
    Sentry.captureMessage('biometric_liveness_result_lookup_failed', {
      level: 'error',
      tags: { source, code: 'rekognition_error' },
      extra: { errorName: getSafeErrorName(error) },
    });

    return createErrorResponse({
      code: 'rekognition_error',
      status: 502,
      state: recordBiometricFailure(activeBiometricState, sessionId),
    });
  }

  const { LIVENESS_CONFIDENCE_THRESHOLD, LIVENESS_SIMILARITY_THRESHOLD } =
    process.env;

  const confidence = response.Confidence ?? 0;

  Sentry.captureMessage('rekognition_liveness_completed', {
    level: 'debug',
    extra: { confidence, source },
    tags: { source },
  });

  const isLive = confidence > Number(LIVENESS_CONFIDENCE_THRESHOLD);

  if (!isLive) {
    Sentry.captureMessage('biometric_liveness_low_confidence', {
      level: 'debug',
      extra: { confidence, source },
      tags: { source, code: 'liveness_low_confidence' },
    });

    return createErrorResponse({
      code: 'liveness_low_confidence',
      status: 403,
      state: recordBiometricFailure(activeBiometricState, sessionId),
    });
  }

  if (response?.ReferenceImage?.Bytes) {
    let targetImageBuffer: ArrayBuffer;

    try {
      targetImageBuffer = await fetchPhotoBuffer(subject.cedula);
    } catch (error) {
      Sentry.captureMessage('biometric_jce_photo_unavailable', {
        level: 'error',
        tags: { source, code: 'jce_photo_unavailable' },
        extra: { errorName: getSafeErrorName(error) },
      });

      return createErrorResponse({
        code: 'jce_photo_unavailable',
        status: 502,
        state: recordBiometricFailure(activeBiometricState, sessionId),
      });
    }

    const compareFacesParams: CompareFacesCommandInput = {
      SourceImage: {
        Bytes: Buffer.from(response.ReferenceImage.Bytes),
      },
      TargetImage: {
        Bytes: Buffer.from(targetImageBuffer),
      },
      SimilarityThreshold: Number(LIVENESS_SIMILARITY_THRESHOLD),
    };

    try {
      Sentry.captureMessage('rekognition_compare_faces_called', {
        level: 'debug',
        tags: { source },
      });

      const { FaceMatches } = await client.compareFaces(compareFacesParams);

      if (!FaceMatches?.length) {
        Sentry.captureMessage('biometric_face_mismatch', {
          level: 'debug',
          tags: { source, code: 'face_mismatch' },
        });

        return createErrorResponse({
          code: 'face_mismatch',
          status: 404,
          state: recordBiometricFailure(activeBiometricState, sessionId),
        });
      }

      Sentry.captureMessage('biometric_face_match_passed', {
        level: 'debug',
        extra: { similarity: FaceMatches[0].Similarity, source },
        tags: { source },
      });

      const nextState = recordBiometricSuccess({
        state: activeBiometricState,
        sessionId,
        confidence,
        similarity: FaceMatches[0].Similarity ?? 0,
      });
      const successResponse = NextResponse.json({
        success: true,
        isMatch: true,
        confidence,
        similarity: FaceMatches[0].Similarity ?? 0,
      });

      successResponse.cookies.set(createBiometricStateCookie(nextState));

      return successResponse;
    } catch (error) {
      Sentry.captureMessage('biometric_compare_faces_failed', {
        level: 'error',
        tags: { source, code: 'rekognition_error' },
        extra: { errorName: getSafeErrorName(error) },
      });

      return createErrorResponse({
        code: 'rekognition_error',
        status: 502,
        state: recordBiometricFailure(activeBiometricState, sessionId),
      });
    }
  }

  return createErrorResponse({
    code: 'liveness_low_confidence',
    status: 403,
    state: recordBiometricFailure(activeBiometricState, sessionId),
  });
}

const fetchPhotoBuffer = async (cedula: string) => {
  const photoUrl = new URL(`${process.env.JCE_PHOTO_API!}/${cedula}/photo`);
  photoUrl.searchParams.append('api-key', process.env.JCE_PHOTO_API_KEY!);

  return fetch(photoUrl).then((res) => {
    if (!res.ok) {
      throw new Error('Citizen photo unavailable');
    }

    return res.arrayBuffer();
  });
};
