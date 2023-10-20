import { NextResponse, type NextRequest } from 'next/server';

import internationalize from '@/middlewares/i18n.middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.match('/api/*')) {
    return internationalize(request);
  }
}

export const config = {
  //? Match all request paths except for these ones
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
