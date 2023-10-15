'use server';

import { cookies } from 'next/headers';

export async function setCookie(key: string, data: any) {
  data = JSON.stringify(data);

  cookies().set(key, data, {
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
