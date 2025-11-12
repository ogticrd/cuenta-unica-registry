import { type NextRequest, NextResponse } from 'next/server';

import internationalize from '@/middlewares/i18n.middleware';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.match('/api/*')) {
    // First, handle internationalization
    const i18nResponse = internationalize(request);
    if (i18nResponse) {
      return i18nResponse;
    }

    // Expose the current pathname via request headers so server components can read it
    const headers = new Headers(request.headers);
    headers.set('x-pathname', request.nextUrl.pathname);

    const response = NextResponse.next({
      request: { headers },
    });

    // Optional: also surface it on the response for debugging or client-side usage
    response.headers.set('x-pathname', request.nextUrl.pathname);

    return response;
  }
}

export const config = {
  //? Match all request paths except for these ones
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|assets).*)',
  ],
};
