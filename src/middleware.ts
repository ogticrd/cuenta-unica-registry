import { NextResponse, type NextRequest } from 'next/server';

const isFileRegex = /(api|_next\/static|_next\/image|favicon\.ico|\/_next)/;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const response = NextResponse.next();

  if (url.pathname.indexOf('.') != -1 || typeof window !== 'undefined')
    return response;
  if (isFileRegex.test(url.pathname)) return response;

  const token = request.cookies.get('token');

  if (!token || token.value !== process.env.SITE_COOKIE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
