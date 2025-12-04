'use server';

import { Configuration, OAuth2Api } from '@ory/client';
import { unwrap } from '@/common/helpers';

const adminBackend = new OAuth2Api(
  new Configuration({
    basePath: process.env.ORY_API_URL,
    accessToken: process.env.ORY_API_TOKEN,
  }),
);

const sdkBackend = new OAuth2Api(
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_ORY_SDK_URL,
    accessToken: process.env.ORY_SDK_TOKEN,
  }),
);

export async function getOAuth2Client(id: string) {
  return adminBackend
    .getOAuth2Client({ id })
    .then((res) => res.data)
    .catch(() => null);
}

export async function introspectAccessToken(token: string) {
  return sdkBackend
    .introspectOAuth2Token({ token })
    .then((res) => res.data)
    .catch(() => null);
}

export async function getUserInfoFromToken(token: string) {
  const url = new URL('/userinfo', process.env.NEXT_PUBLIC_ORY_SDK_URL);

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
    .then(unwrap)
    .catch(() => null);
}
