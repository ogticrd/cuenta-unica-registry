import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

const VID_FLOW_PREFIX = 'vid_flow_';
const VID_FLOW_TTL = 120;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = (searchParams.get('lang') as Locale) || 'es';
  const baseUrl = getBaseUrl(request);

  const params = {
    access_token: searchParams.get('access_token'),
    client_id: searchParams.get('client_id'),
    redirect_uri: searchParams.get('redirect_uri'),
    state: searchParams.get('state') ?? undefined,
  };

  // Validate all params are present
  if (!params.access_token || !params.client_id || !params.redirect_uri) {
    return NextResponse.redirect(new URL(`/${lang}/vid`, baseUrl));
  }

  try {
    const intl = await getDictionary(lang);

    // Dynamic import to avoid bundling issues
    const { createInputSchema } = await import('@/app/[lang]/vid/input.schema');

    const result = await createInputSchema(intl).safeParseAsync(params);

    if (!result.success) {
      return NextResponse.redirect(new URL(`/${lang}/vid`, baseUrl));
    }

    const { citizen, redirectUri, state } = result.data;

    // Create flow
    const flowId = randomUUID();
    const flowData = {
      cedula: citizen.id,
      citizenName: citizen.name ?? '',
      redirectUri,
      state,
      createdAt: Date.now(),
    };

    const cookieStore = await cookies();
    cookieStore.set(
      `${VID_FLOW_PREFIX}${flowId}`,
      btoa(JSON.stringify(flowData)),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: VID_FLOW_TTL,
        sameSite: 'lax',
        path: '/',
      },
    );

    // Redirect to clean URL
    return NextResponse.redirect(
      new URL(`/${lang}/vid?flow=${flowId}`, baseUrl),
    );
  } catch (error) {
    console.error('VID flow creation failed:', error);
    return NextResponse.redirect(new URL(`/${lang}/vid`, baseUrl));
  }
}

/**
 * Get the base URL from the request, preferring
 * X-Forwarded-Host header.
 */
function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Fallback to request origin
  return request.nextUrl.origin;
}
