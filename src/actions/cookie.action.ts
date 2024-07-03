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

export async function getCookie<T>(key: string) {
  let data = cookies().get(key)?.value;

  try {
    data = JSON.parse(data || '{}');
    return data as T;
  } catch (err) {
    return null;
  }
}
