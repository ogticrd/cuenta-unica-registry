import type { CompareFacesCommandInput } from '@aws-sdk/client-rekognition';
import { NextRequest, NextResponse } from 'next/server';

import { getRekognitionClient } from '@/helpers';
import logger from '@/lib/logger';
import {
  LIVENESS_LOW_CONFIDENCE_ERROR,
  LIVENESS_NO_MATCH_ERROR,
} from '@/constants';

type Props = { params: { sessionId: string; cedula: string } };

export async function GET(
  req: NextRequest,
  { params: { sessionId, cedula } }: Props,
) {
  const client = await getRekognitionClient(req);
  const response = await client.getFaceLivenessSessionResults({
    SessionId: sessionId,
  });

  const confidence = response.Confidence ?? 0;
  // Threshold for face liveness
  const isLive = confidence > 85;

  if (!isLive) {
    logger.warn(`Low confidence (${confidence}%) for citizen ${cedula}`);

    return NextResponse.json(
      {
        message: LIVENESS_LOW_CONFIDENCE_ERROR,
        isLive,
      },
      { status: 403 },
    );
  }

  logger.info(`High confidence (${confidence}%) for citizen ${cedula}`);

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
        // Threshold for face match
        SimilarityThreshold: 95,
      };

      const { FaceMatches } = await client.compareFaces(params);

      if (!FaceMatches?.length) {
        logger.warn(`Low similarity for citizen ${cedula}`);

        return NextResponse.json(
          {
            message: LIVENESS_NO_MATCH_ERROR,
            isMatch: false,
          },
          {
            status: 404,
          },
        );
      }

      const similarity = FaceMatches[0].Similarity;

      logger.info(`High similarity (${similarity}%) for citizen ${cedula}`);

      return NextResponse.json({ isMatch: true });
    } catch (error) {
      logger.error(error);

      return NextResponse.json(
        {
          message: LIVENESS_NO_MATCH_ERROR,
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
