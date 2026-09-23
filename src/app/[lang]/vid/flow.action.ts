'use server';

import { cookies } from 'next/headers';

import { parseSignedCookieValue } from '@/common/helpers/signed-cookie';

const VID_FLOW_PREFIX = 'vid_flow_';
const VID_FLOW_TTL = 120; // seconds
const VID_FLOW_COOKIE_CONTEXT = 'vid-flow-cookie:v1';

export type VidFlowData = {
  cedula: string;
  citizenName: string;
  redirectUri: string;
  state?: string;
  createdAt: number;
};

function isVidFlowData(value: unknown): value is VidFlowData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<VidFlowData>;

  return (
    typeof data.cedula === 'string' &&
    data.cedula.replace(/\D/g, '') === data.cedula &&
    data.cedula.length === 11 &&
    typeof data.citizenName === 'string' &&
    typeof data.redirectUri === 'string' &&
    (data.state === undefined || typeof data.state === 'string') &&
    typeof data.createdAt === 'number' &&
    Number.isFinite(data.createdAt)
  );
}

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
    const data = parseSignedCookieValue(
      cookie.value,
      VID_FLOW_COOKIE_CONTEXT,
      isVidFlowData,
    );

    if (!data) {
      return null;
    }

    // Check if flow has expired (extra safety beyond cookie TTL)
    if (Date.now() - data.createdAt > VID_FLOW_TTL * 1000) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
