'use server';

import { Configuration, OAuth2Api } from '@ory/client';

const backend = new OAuth2Api(
  new Configuration({
    basePath: process.env.ORY_API_URL,
    accessToken: process.env.ORY_API_TOKEN,
  }),
);

export async function getOAuth2Client(id: string) {
  return backend
    .getOAuth2Client({ id })
    .then((res) => res.data)
    .catch((e) => {
      console.log(e.status);
      console.log(e.response?.data);
      return null;
    });
}
