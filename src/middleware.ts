import { NextResponse, type NextRequest } from 'next/server';
import csrf from 'edge-csrf';

const csrfProtect = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 10,
  },
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // csrf protection
  const csrfError = await csrfProtect(request, response);

  // check result
  if (csrfError) {
    return new NextResponse('invalid csrf token', { status: 403 });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
