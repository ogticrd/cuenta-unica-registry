import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { Identity } from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<any> {
  const { token } = req.cookies;

  if (token !== process.env.SITE_COOKIE_KEY) {
    return res.status(401).send(null);
  }

  const http = axios.create({
    baseURL: process.env.ORY_SDK_URL,
    headers: {
      Authorization: 'Bearer ' + process.env.ORY_SDK_TOKEN,
    },
  });

  if (req.method === 'GET') {
    const { cedula } = req.query;

    const { data: identities } = await http.get<Identity[]>(
      `/admin/identities?credentials_identifier=${cedula}`
    );

    return res.status(200).json(identities);
  }
}
