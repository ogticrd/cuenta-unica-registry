import { type NextRequest, NextResponse } from 'next/server';

import internationalize from '@/middlewares/i18n.middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.match('/api/*')) {
    const i18nResponse = internationalize(request);
    if (i18nResponse) {
      return i18nResponse;
    }

    const headers = new Headers(request.headers);
    headers.set('x-pathname', request.nextUrl.pathname);

    const response = NextResponse.next({
      request: { headers },
    });

    return response;
  }
}

export const config = {
  //? Match all request paths except for these ones
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|assets).*)',
  ],
};
