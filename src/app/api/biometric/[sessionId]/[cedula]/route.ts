import type { CompareFacesCommandInput } from '@aws-sdk/client-rekognition';
import { NextRequest, NextResponse } from 'next/server';

import { getRekognitionClient } from '@/common/helpers';
// import logger from '@/lib/logger';

type Props = { params: { sessionId: string; cedula: string } };

export async function GET(
  req: NextRequest,
  { params: { sessionId, cedula } }: Props,
) {
  const client = await getRekognitionClient(req);
  const response = await client.getFaceLivenessSessionResults({
    SessionId: sessionId,
  });

  const LIVENESS_THRESHOLD_VALUE = +process.env.LIVENESS_THRESHOLD_VALUE!;
  const LIVENESS_SIMILARIY_VALUE = +process.env.LIVENESS_SIMILARIY_VALUE!;

  const confidence = response.Confidence ?? 0;
  // Threshold for face liveness
  const isLive = confidence > LIVENESS_THRESHOLD_VALUE;

  if (!isLive) {
    console.warn(`Low confidence (${confidence}%) for citizen ${cedula}`);

    return NextResponse.json(
      {
        message: 'intl.errors.liveness.lowConfidence',
        isLive,
      },
      { status: 403 },
    );
  }

  console.info(`High confidence (${confidence}%) for citizen ${cedula}`);

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
        SimilarityThreshold: LIVENESS_SIMILARIY_VALUE,
      };

      const { FaceMatches } = await client.compareFaces(params);

      if (!FaceMatches?.length) {
        console.warn(`Low similarity for citizen ${cedula}`);

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

      const similarity = FaceMatches[0].Similarity;

      console.info(`High similarity (${similarity}%) for citizen ${cedula}`);

      return NextResponse.json({ isMatch: true });
    } catch (error) {
      console.error(error);

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
