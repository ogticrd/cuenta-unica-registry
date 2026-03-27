import "server-only";

import {
  CompareFacesCommand,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
} from "@aws-sdk/client-rekognition";
import { getRekognitionClient } from "@/lib/aws/rekognition-client";

export async function createLivenessSession(): Promise<string> {
  const client = getRekognitionClient();

  const command = new CreateFaceLivenessSessionCommand({
    Settings: {
      ChallengePreferences: [{ Type: "FaceMovementAndLightChallenge" }],
    },
  });

  const response = await client.send(command);

  if (!response.SessionId) {
    throw new Error("Rekognition did not return a SessionId");
  }

  return response.SessionId;
}

export interface LivenessResult {
  confidence: number;
  referenceImageBytes: Uint8Array | null;
  status: string;
}

export async function getLivenessResults(
  sessionId: string,
): Promise<LivenessResult> {
  const client = getRekognitionClient();

  const command = new GetFaceLivenessSessionResultsCommand({
    SessionId: sessionId,
  });

  const response = await client.send(command);

  return {
    confidence: response.Confidence ?? 0,
    referenceImageBytes: response.ReferenceImage?.Bytes ?? null,
    status: response.Status ?? "UNKNOWN",
  };
}

export interface FaceComparisonResult {
  similarity: number;
  isMatch: boolean;
}

export async function compareFaces(
  sourceImageBytes: Uint8Array,
  targetImageBytes: Uint8Array,
  similarityThreshold: number,
): Promise<FaceComparisonResult> {
  const client = getRekognitionClient();

  const command = new CompareFacesCommand({
    SourceImage: { Bytes: sourceImageBytes },
    TargetImage: { Bytes: targetImageBytes },
    SimilarityThreshold: similarityThreshold,
  });

  const response = await client.send(command);
  const similarity = response.FaceMatches?.[0]?.Similarity ?? 0;

  return {
    similarity,
    isMatch: similarity >= similarityThreshold,
  };
}
