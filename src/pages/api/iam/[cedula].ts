import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { Identity } from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ exists: boolean } | void>
): Promise<void> {
  const { token } = req.cookies;

  if (token !== process.env.SITE_COOKIE_KEY) {
    return res.status(401).send();
  }

  const http = axios.create({
    baseURL: process.env.ORY_SDK_URL,
    headers: {
      Authorization: 'Bearer ' + process.env.ORY_SDK_TOKEN,
    },
  });

  const { cedula } = req.query;

  const { data: identity } = await http.get<Identity[]>(
    `/admin/identities?credentials_identifier=${cedula}`
  );

  const exists = identity.length !== 0;

  res.status(200).json({ exists });
}
