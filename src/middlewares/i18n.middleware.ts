import { match as matchLocale } from '@formatjs/intl-localematcher';
import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';

import { i18n } from '@/i18n-config';

export default function internationalize(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) =>
      !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    const prefix = pathname.startsWith('/') ? '' : '/';

    return NextResponse.redirect(
      new URL(`/${locale}${prefix}${pathname}${search}`, request.url),
    );
  }
}

function getLocale(request: NextRequest): string | undefined {
  // Transforming headers because Negotiator expects a plain object.
  const headers = Object.fromEntries(request.headers.entries());

  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales;

  // Use negotiator and intl-localematcher to get best locale
  let languages = new Negotiator({ headers }).languages(locales);

  // return matchLocale(languages, locales, i18n.defaultLocale);
  return i18n.defaultLocale;
}
