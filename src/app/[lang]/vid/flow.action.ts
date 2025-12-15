'use server';

import { cookies } from 'next/headers';

const VID_FLOW_PREFIX = 'vid_flow_';
const VID_FLOW_TTL = 120; // seconds

export type VidFlowData = {
  cedula: string;
  citizenName: string;
  redirectUri: string;
  state?: string;
  createdAt: number;
};

export async function getVidFlow(flowId: string): Promise<VidFlowData | null> {
  if (!flowId || !/^[0-9a-f-]{36}$/i.test(flowId)) {
    return null;
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(`${VID_FLOW_PREFIX}${flowId}`);

  if (!cookie?.value) {
    return null;
  }

  try {
    const data = JSON.parse(atob(cookie.value)) as VidFlowData;

    // Check if flow has expired (extra safety beyond cookie TTL)
    if (Date.now() - data.createdAt > VID_FLOW_TTL * 1000) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
