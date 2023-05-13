import { NextApiRequest, NextApiResponse } from "next/types";
import axios from "axios";

import { getRekognitionClient } from "@/helpers";

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

  const rekognition = await getRekognitionClient(req);

  if (req.method === "GET") {
    const { sessionId, cedula } = req.query;
    const SessionId = sessionId as string;

    const response = await rekognition.getFaceLivenessSessionResults({
      SessionId,
    });

    let isLive: any;
    let base64Image = "";
    let result: any;

    if (response.Confidence) {
      isLive = response.Confidence > 90;
    }

    if (response.ReferenceImage && response.ReferenceImage.Bytes) {
      base64Image = response.ReferenceImage.Bytes.toString();

      const { data } = await http.get(`/${cedula}/photo`, {
        params: {
          "api-key": process.env.NEXT_PUBLIC_PHOTO_API_KEY,
        },
        responseType: "arraybuffer",
      });

      try {
        result = await rekognition.compareFaces({
          SimilarityThreshold: 80,
          TargetImage: {
            Bytes: data,
          },
          SourceImage: {
            Bytes: response.ReferenceImage.Bytes,
          },
        });
      } catch (ex) {
        console.log(`Biometry validation failed for citizen ${cedula}`);

        return res.status(500).json({
          success: false,
        });
      }
    }

    const { FaceMatches } = result;
    const isFaceMatched =
      FaceMatches && FaceMatches.length && FaceMatches[0].Similarity > 90;

    console.log(`Biometry validation successfully for citizen ${cedula}`);

    return res.status(200).json({
      match: isFaceMatched,
    });
  } else if (req.method === "POST") {
    const { SessionId: sessionId } =
      await rekognition.createFaceLivenessSession({});

    return res.status(201).json({ sessionId });
  }
}
