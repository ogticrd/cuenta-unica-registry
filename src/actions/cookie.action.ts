'use server';

import { cookies } from 'next/headers';

export async function setCookie<T>(key: string, data: T) {
  cookies().set(key, JSON.stringify(data), {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 10,
    sameSite: 'strict',
    path: '/',
  });
}

export async function getCookie(key: string) {
  const data = cookies().get(key);

  return data ? JSON.parse(data.value) : null;
}
