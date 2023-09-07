'use server';

import { cookies } from 'next/headers';

export async function setCookie() {
  const key = process.env.SITE_COOKIE_KEY as string;

  cookies().set('token', key, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 10,
    sameSite: 'strict',
    path: '/',
  });
}
