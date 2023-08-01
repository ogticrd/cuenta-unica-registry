import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { getRekognitionClient } from '@/helpers';
import logger from '@/lib/logger';

import {
  LIVENESS_LOW_CONFIDENCE_ERROR,
  LIVENESS_NO_MATCH_ERROR,
} from '@/constants';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | void>
): Promise<any> {
  const { token } = req.cookies;

  if (token !== process.env.SITE_COOKIE_KEY) {
    return res.status(401).send(null);
  }

  const http = axios.create({
    baseURL: process.env.JCE_PHOTO_API,
  });

  const client = await getRekognitionClient(req);

  if (req.method === 'GET') {
    const { sessionId, cedula } = req.query;
    const SessionId = sessionId as string;

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
      return res.status(200).end(
        JSON.stringify({
          message: LIVENESS_LOW_CONFIDENCE_ERROR,
          isLive: isLive,
        })
      );
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
          return res.status(200).end(JSON.stringify({ isMatch: true }));
        } else {
          logger.warn(`Low similarity for citizen ${cedula}`);
          return res.status(200).end(
            JSON.stringify({
              message: LIVENESS_NO_MATCH_ERROR,
              isMatch: false,
            })
          );
        }
      } catch (error) {
        logger.error(error);
        return res.status(500).end();
      }
    }
  } else if (req.method === 'POST') {
    const response = await client.createFaceLivenessSession({
      // TODO: Create a unique token for each request, and reuse on retry
      // ClientRequestToken: req.cookies.token,
    });
    return res.status(201).json({ sessionId: response.SessionId });
  }
}
