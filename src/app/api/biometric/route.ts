import { NextRequest, NextResponse } from 'next/server';

import { getRekognitionClient } from '@/helpers';
import logger from '@/lib/logger';
import {
  LIVENESS_LOW_CONFIDENCE_ERROR,
  LIVENESS_NO_MATCH_ERROR,
} from '@/constants';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const SessionId = searchParams.get('sessionId')!;
  const cedula = searchParams.get('cedula');

  const client = await getRekognitionClient(req);
  const response = await client.getFaceLivenessSessionResults({
    SessionId,
  });

  let isLive = false;
  const confidence = response.Confidence;

  // Threshold for face liveness
  if (confidence && confidence > 85) {
    logger.info(`High confidence (${confidence}%) for citizen ${cedula}`);
    isLive = true;
  } else {
    logger.warn(`Low confidence (${confidence}%) for citizen ${cedula}`);
    return NextResponse.json({
      message: LIVENESS_LOW_CONFIDENCE_ERROR,
      isLive: isLive,
      status: 200,
    });
  }

  if (isLive && response.ReferenceImage && response.ReferenceImage.Bytes) {
    const photoUrl = new URL(`${process.env.JCE_PHOTO_API!}/${cedula}/photo`);
    photoUrl.searchParams.append('api-key', process.env.JCE_PHOTO_API_KEY!);

    const data = await fetch(photoUrl).then((res) => res.arrayBuffer());

    const params = {
      SourceImage: {
        Bytes: Buffer.from(response.ReferenceImage.Bytes),
      },
      TargetImage: {
        Bytes: Buffer.from(data),
      },
      // Threshold for face match
      SimilarityThreshold: 95,
    };

    try {
      const response = await client.compareFaces(params);

      if (response.FaceMatches?.length) {
        const similarity = response.FaceMatches[0].Similarity;
        logger.info(`High similarity (${similarity}%) for citizen ${cedula}`);

        return NextResponse.json({
          isMatch: true,
        });
      } else {
        logger.warn(`Low similarity for citizen ${cedula}`);

        return NextResponse.json({
          message: LIVENESS_NO_MATCH_ERROR,
          isMatch: false,
        });
      }
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

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
): Promise<any> {
  const client = await getRekognitionClient(req);

  const response = await client.createFaceLivenessSession({
    // TODO: Create a unique token for each request, and reuse on retry
    // ClientRequestToken: req.cookies.token,
  });
  return NextResponse.json({
    sessionId: response.SessionId,
    status: 200,
  });
}
