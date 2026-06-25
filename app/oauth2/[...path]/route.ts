import { type NextRequest, NextResponse } from "next/server";

function getOryPublicUrl() {
  return (process.env.ORY_PUBLIC_URL || process.env.ORY_SDK_URL)?.replace(
    /\/$/,
    "",
  );
}

function buildOryOAuthUrl(request: NextRequest, path: string[]) {
  const baseUrl = getOryPublicUrl();

  if (!baseUrl) {
    return null;
  }

  const target = new URL(
    `/oauth2/${path.map(encodeURIComponent).join("/")}`,
    baseUrl,
  );
  target.search = request.nextUrl.search;

  return target;
}

async function redirectToOryOAuth(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const target = buildOryOAuthUrl(request, path);

  if (!target) {
    return NextResponse.json(
      { error: "Missing ORY_PUBLIC_URL or ORY_SDK_URL environment variable" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(target, 307);
}

export const GET = redirectToOryOAuth;
export const POST = redirectToOryOAuth;
