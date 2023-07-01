import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { getRekognitionClient } from '@/helpers';

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

    if (response.Confidence && response.Confidence > 85) {
      isLive = true; // Confidence threshold for live face
    } else {
      console.log(`Low confidence for citizen ${cedula}`);
      return res.status(200).end(
        JSON.stringify({
          error: 'Low Confidence',
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
        SimilarityThreshold: 95,
      };

      try {
        const compare = await client.compareFaces(params);
        if (compare.FaceMatches && compare.FaceMatches.length) {
          console.log(`Citizen ${cedula} matched`);
          return res.status(200).end(JSON.stringify({ isMatch: true }));
        } else {
          console.log(`Citizen ${cedula} didn't match`);
          return res
            .status(200)
            .end(JSON.stringify({ error: 'No Match', isMatch: false }));
        }
      } catch (error) {
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
