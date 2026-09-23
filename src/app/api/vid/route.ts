import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/nextjs';

import { serializeSignedCookieValue } from '@/common/helpers/signed-cookie';
import { getDictionary, type Dictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

const VID_FLOW_PREFIX = 'vid_flow_';
const VID_FLOW_TTL = 120;
const VID_FLOW_COOKIE_CONTEXT = 'vid-flow-cookie:v1';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = (searchParams.get('lang') as Locale) || 'es';
  const baseUrl = getBaseUrl(request);
  const intl = await getDictionary(lang);

  const params = {
    access_token: searchParams.get('access_token'),
    client_id: searchParams.get('client_id'),
    redirect_uri: searchParams.get('redirect_uri'),
    state: searchParams.get('state') ?? undefined,
  };

  if (!params.access_token || !params.client_id || !params.redirect_uri) {
    const errorMessage = encodeURIComponent(intl.errors.vid.invalidParameters);
    return NextResponse.redirect(
      new URL(`/${lang}/vid?error=${errorMessage}`, baseUrl),
    );
  }

  try {
    const { createInputSchema } = await import('@/app/[lang]/vid/input.schema');

    const result = await createInputSchema(intl).safeParseAsync(params);

    if (!result.success) {
      const errorMessage = resolveSafeVidErrorMessage(
        result.error.issues?.[0]?.message,
        intl,
      );
      const encodedError = encodeURIComponent(errorMessage);
      return NextResponse.redirect(
        new URL(`/${lang}/vid?error=${encodedError}`, baseUrl),
      );
    }

    const { citizen, redirectUri, state } = result.data;

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
      serializeSignedCookieValue(flowData, VID_FLOW_COOKIE_CONTEXT),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: VID_FLOW_TTL,
        sameSite: 'lax',
        path: '/',
      },
    );

    return NextResponse.redirect(
      new URL(`/${lang}/vid?flow=${flowId}`, baseUrl),
    );
  } catch (error) {
    Sentry.captureMessage('vid_flow_creation_failed', {
      level: 'error',
      tags: { code: 'vid_flow_creation_failed' },
      extra: { errorName: getSafeErrorName(error) },
    });

    const errorMessage = resolveSafeVidErrorMessage(error, intl);
    const encodedError = encodeURIComponent(errorMessage);
    return NextResponse.redirect(
      new URL(`/${lang}/vid?error=${encodedError}`, baseUrl),
    );
  }
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

function resolveSafeVidErrorMessage(
  error: unknown,
  intl: Dictionary,
): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const safeMessages = new Set([
    intl.errors.cedula.invalid,
    intl.errors.vid.invalidParameters,
    intl.errors.vid.invalidToken,
    intl.errors.vid.invalidClient,
    intl.errors.vid.invalidRedirectUri,
  ]);

  return safeMessages.has(message)
    ? message
    : intl.errors.vid.invalidParameters;
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
