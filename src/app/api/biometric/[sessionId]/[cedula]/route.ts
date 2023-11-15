import type { CompareFacesCommandInput } from '@aws-sdk/client-rekognition';
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import { getRekognitionClient } from '@/common/helpers';

type Props = { params: { sessionId: string; cedula: string } };

export async function GET(
  req: NextRequest,
  { params: { sessionId, cedula } }: Props,
) {
  const client = await getRekognitionClient(req);
  const response = await client.getFaceLivenessSessionResults({
    SessionId: sessionId,
  });

  const { LIVENESS_CONFIDENCE_THRESHOLD, LIVENESS_SIMILARITY_THRESHOLD } =
    process.env;

  const confidence = response.Confidence ?? 0;

  const isLive = confidence > Number(LIVENESS_CONFIDENCE_THRESHOLD);

  if (!isLive) {
    Sentry.captureMessage('Low confidence', {
      level: 'debug',
      extra: { cedula, confidence },
      tags: { type: 'confidence' },
    });

    return NextResponse.json(
      {
        message: 'intl.errors.liveness.lowConfidence',
        isLive,
      },
      { status: 403 },
    );
  }

  Sentry.captureMessage('High confidence', {
    level: 'debug',
    extra: { cedula, confidence },
    tags: { type: 'confidence' },
  });

  if (response?.ReferenceImage?.Bytes) {
    const targetImageBuffer = await fetchPhotoBuffer(cedula);

    try {
      const params: CompareFacesCommandInput = {
        SourceImage: {
          Bytes: Buffer.from(response.ReferenceImage.Bytes),
        },
        TargetImage: {
          Bytes: Buffer.from(targetImageBuffer),
        },
        SimilarityThreshold: Number(LIVENESS_SIMILARITY_THRESHOLD),
      };

      const { FaceMatches } = await client.compareFaces(params);

      if (!FaceMatches?.length) {
        Sentry.captureMessage('Low similarity', {
          level: 'debug',
          extra: { cedula },
          tags: { type: 'similarity' },
        });

        return NextResponse.json(
          {
            message: 'intl.errors.liveness.noMatch',
            isMatch: false,
          },
          {
            status: 404,
          },
        );
      }

      Sentry.captureMessage('High similarity', {
        level: 'debug',
        extra: { cedula, similarity: FaceMatches[0].Similarity },
        tags: { type: 'similarity' },
      });

      return NextResponse.json({ isMatch: true });
    } catch (error) {
      Sentry.captureException(error);

      return NextResponse.json(
        {
          message: 'intl.errors.liveness.noMatch',
          isMatch: false,
        },
        { status: 500 },
      );
    }
  }
}

const fetchPhotoBuffer = async (cedula: string) => {
  const photoUrl = new URL(`${process.env.JCE_PHOTO_API!}/${cedula}/photo`);
  photoUrl.searchParams.append('api-key', process.env.JCE_PHOTO_API_KEY!);

  return fetch(photoUrl).then((res) => res.arrayBuffer());
};
