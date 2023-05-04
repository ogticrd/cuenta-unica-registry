import { NextApiRequest, NextApiResponse } from "next/types";

import { getRekognitionClient } from "@/helpers/rekognition";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<any> {
  const rekognition = await getRekognitionClient(req);

  if (req.method === "GET") {
    const { sessionId, cedula } = req.query;
    const SessionId = sessionId as string;

    const response = await rekognition.getFaceLivenessSessionResults({
      SessionId,
    });

    let isLive: any;
    let base64Image: string = "";

    if (response.Confidence) {
      isLive = response.Confidence > 90;
    }

    if (response.ReferenceImage && response.ReferenceImage.Bytes) {
      base64Image = response.ReferenceImage.Bytes.toString();
      // TODO: implement face match
      // rekognition.compareFaces({
      //   SourceImage: {
      //     Bytes: response.ReferenceImage.Bytes,
      //   },
      //   TargetImage: {
      //     Bytes: response.ReferenceImage.Bytes,
      //   },
      // });
    }

    return res.status(200).json({
      isLive,
      base64Image,
    });
  } else if (req.method === "POST") {
    const { SessionId: sessionId } =
      await rekognition.createFaceLivenessSession({});

    return res.status(201).json({ sessionId });
  }
}
