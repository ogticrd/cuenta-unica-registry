import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const token = request.cookies.get('token');

  if (!token || token.value !== process.env.SITE_COOKIE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
