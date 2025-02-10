'use server';

import { cookies } from 'next/headers';

export async function setCookie<T>(key: string, data: T) {
  const payload = JSON.stringify(data);

  (await cookies()).set(key, btoa(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 10,
    sameSite: 'strict',
    path: '/',
  });
}

export async function getCookie<T>(key: string) {
  let data = (await cookies()).get(key)?.value;

  try {
    return JSON.parse(atob(data as string)) as T;
  } catch (err) {
    return null;
  }
}

export async function removeCookie(key: string) {
  (await cookies()).delete(key);
}
