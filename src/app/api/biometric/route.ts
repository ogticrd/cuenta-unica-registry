import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { getRekognitionClient } from '@/helpers';
import logger from '@/lib/logger';

import {
  LIVENESS_LOW_CONFIDENCE_ERROR,
  LIVENESS_NO_MATCH_ERROR,
} from '@/constants';

export async function GET(
  req: NextRequest,
  res: NextResponse<any | void>,
): Promise<any> {
  const http = axios.create({
    baseURL: process.env.JCE_PHOTO_API,
  });
  const url = new URL(req.url);

  const sessionId = url.searchParams.get('sessionId');
  const cedula = url.searchParams.get('cedula');

  const SessionId = sessionId as string;

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
    const { data } = await http.get(`/${cedula}/photo`, {
      params: {
        'api-key': process.env.JCE_PHOTO_API_KEY,
      },
      responseType: 'arraybuffer',
    });

    const buffer1 = Buffer.from(response.ReferenceImage.Bytes);
    const buffer2 = Buffer.from(data, 'base64');
    const params = {
      SourceImage: {
        Bytes: buffer1,
      },
      TargetImage: {
        Bytes: buffer2,
      },
      // Threshold for face match
      SimilarityThreshold: 95,
    };

    try {
      const response = await client.compareFaces(params);
      if (response.FaceMatches && response.FaceMatches.length) {
        const similarity = response.FaceMatches[0].Similarity;
        logger.info(`High similarity (${similarity}%) for citizen ${cedula}`);
        return NextResponse.json({
          isMatch: true,
          status: 200,
        });
      } else {
        logger.warn(`Low similarity for citizen ${cedula}`);
        return NextResponse.json({
          message: LIVENESS_NO_MATCH_ERROR,
          isMatch: false,
          status: 200,
        });
      }
    } catch (error) {
      logger.error(error);
      return NextResponse.json({
        message: LIVENESS_NO_MATCH_ERROR,
        isMatch: false,
        status: 500,
      });
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } },
  res: NextResponse<any | void>,
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
