'use server';

import { cookies } from 'next/headers';

export async function setCookie<T>(key: string, data: T) {
  (await cookies()).set(key, JSON.stringify(data), {
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
    data = JSON.parse(data || '{}');
    return data as T;
  } catch (err) {
    return null;
  }
}
