import "server-only";

import type {
  CitizenBasicInformation,
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
  CitizensTokenResponse,
} from "@/lib/types/registration/citizen-api";
import type {
  CitizenLookupResult,
  CitizenProfileResult,
} from "@/lib/types/registration/citizen";
import { normalizeCedula } from "@/lib/utils/cedula";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Request failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`,
    );
  }

  return response.json() as Promise<T>;
}

async function fetchCitizenAuthHeaders() {
  const tokenEndpoint = getRequiredEnv("CEDULA_TOKEN_API");
  const authKey = getRequiredEnv("CITIZENS_API_AUTH_KEY");

  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${authKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  }).then<CitizensTokenResponse>(parseJsonResponse);

  return {
    Authorization: `Bearer ${tokenResponse.access_token}`,
  };
}

function buildCitizenUrl(cedula: string, resource: "basic" | "birth") {
  const baseUrl = getRequiredEnv("CEDULA_API").replace(/\/$/, "");
  const apiKey = getRequiredEnv("CEDULA_API_KEY");
  const url = new URL(`${baseUrl}/${normalizeCedula(cedula)}/info/${resource}`);

  url.searchParams.append("api-key", apiKey);

  return url;
}

async function fetchCitizenBasicInformation(cedula: string) {
  const headers = await fetchCitizenAuthHeaders();
  const response = await fetch(buildCitizenUrl(cedula, "basic"), {
    headers,
    cache: "no-store",
  }).then<CitizensBasicInformationResponse>(parseJsonResponse);

  if (!response.valid || !response.payload) {
    return null;
  }

  return response.payload;
}

async function fetchCitizenBirthInformation(cedula: string) {
  const headers = await fetchCitizenAuthHeaders();
  const response = await fetch(buildCitizenUrl(cedula, "birth"), {
    headers,
    cache: "no-store",
  }).then<CitizensBirthInformationResponse>(parseJsonResponse);

  if (!response.valid || !response.payload) {
    return null;
  }

  return response.payload;
}

function getFirstName(names: string) {
  return names.trim().split(/\s+/).filter(Boolean)[0] ?? "";
}

function buildLastName(citizen: CitizenBasicInformation) {
  return [citizen.firstSurname, citizen.secondSurname]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function findCitizenSummaryByCedula(
  cedula: string,
): Promise<CitizenLookupResult | null> {
  const citizen = await fetchCitizenBasicInformation(cedula);

  if (!citizen) {
    return null;
  }

  return {
    id: citizen.id,
    firstName: getFirstName(citizen.names),
  };
}

export async function findCitizenByCedula(
  cedula: string,
): Promise<CitizenProfileResult | null> {
  const citizen = await fetchCitizenBasicInformation(cedula);

  if (!citizen) {
    return null;
  }

  const birth = await fetchCitizenBirthInformation(cedula);

  if (!birth) {
    return null;
  }

  return {
    id: citizen.id,
    names: citizen.names,
    firstName: getFirstName(citizen.names),
    lastName: buildLastName(citizen),
    birthDate: birth.birthDate.split("T")[0] ?? birth.birthDate,
    gender: citizen.gender,
  };
}
