import { getOryClient } from "@/lib/ory/client";
import { getServerCookies } from "@/lib/ory/cookies";
import { getCitizenIdFromSession } from "./citizen-id";

export async function getAuthenticatedCitizenId() {
  const cookie = await getServerCookies();
  const oryClient = getOryClient();
  const { data: session } = await oryClient.toSession({ cookie });
  return getCitizenIdFromSession(session);
}
