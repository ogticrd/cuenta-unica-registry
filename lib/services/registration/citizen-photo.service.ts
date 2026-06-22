import "server-only";

import { normalizeCedula } from "@/lib/utils/cedula";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

export async function fetchCitizenPhoto(cedula: string): Promise<Uint8Array> {
  const baseUrl = getRequiredEnv("CITIZENS_API_BASE_URL").replace(/\/$/, "");
  const apiKey = getRequiredEnv("CITIZENS_PHOTO_API_KEY");
  const normalizedCedula = normalizeCedula(cedula);

  const url = new URL(
    `${baseUrl}/v1/citizens/pictures/${normalizedCedula}/photo`,
  );
  url.searchParams.append("api-key", apiKey);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Citizen photo request failed with status ${response.status}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer().catch(() => {
    throw new Error("Citizen photo response could not be read");
  });
  return new Uint8Array(arrayBuffer);
}
