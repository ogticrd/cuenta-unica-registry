import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { getRekognitionClient } from '@/helpers';
import {
  GetFaceLivenessSessionResultsCommand,
  CompareFacesCommand,
  CreateFaceLivenessSessionCommand,
} from '@aws-sdk/client-rekognition';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any | void>
): Promise<any> {
  const { token } = req.cookies;

  if (token !== process.env.NEXT_PUBLIC_COOKIE_KEY) {
    return res.status(401).send(null);
  }

  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_PHOTO_API,
  });

  const client = await getRekognitionClient(req);

  if (req.method === 'GET') {
    const { sessionId, cedula } = req.query;
    const SessionId = sessionId as string;

    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId,
    });
    const response = await client.send(command);

    let isLive;

    if (response.Confidence) {
      isLive = response.Confidence > 90;
    }

    if (isLive && response.ReferenceImage && response.ReferenceImage.Bytes) {
      const { data } = await http.get(`/${cedula}/photo`, {
        params: {
          'api-key': process.env.NEXT_PUBLIC_PHOTO_API_KEY,
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
        SimilarityThreshold: 90,
      };

      const command = new CompareFacesCommand(params);
      let similarPercent = 0;

      try {
        const compare = await client.send(command);
        if (compare.FaceMatches && compare.FaceMatches.length) {
          compare.FaceMatches.forEach((data) => {
            similarPercent = data.Similarity as number;
          });

          if (similarPercent > 90) {
            console.log(`Biometry validation successfully for citizen ${cedula}`);
            res.status(200).end(JSON.stringify({match: true}));
          } else {
            console.log(`Biometry validation failed for citizen ${cedula}`);
            res.status(200).end(JSON.stringify({match: false}));
          }
        }
      } catch (error) {
        console.log(`Biometry validation failed for citizen ${cedula}`);
        res.status(500).end();
      }
    }
  } else if (req.method === 'POST') {
    const command = new CreateFaceLivenessSessionCommand({
      ClientRequestToken: req.cookies.token,
    });
    const { SessionId: sessionId } = await client.send(command);

    return res.status(201).json({ sessionId });
  }
}
