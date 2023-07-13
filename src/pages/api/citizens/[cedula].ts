import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import {
  CitizensBasicInformationResponse,
  CitizensTokenResponse,
} from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ name: string; id: string } | void>
): Promise<void> {
  const { token } = req.cookies;

  if (token !== process.env.SITE_COOKIE_KEY) {
    return res.status(401).send();
  }

  const http = axios.create({
    baseURL: process.env.CEDULA_API,
  });

  const { cedula } = req.query;

  const { data: citizensToken } = await http.post<CitizensTokenResponse>(
    `${process.env.CEDULA_TOKEN_API}`,
    {
      grant_type: 'client_credentials',
    },
    {
      headers: {
        Authorization: `Basic ${process.env.CITIZENS_API_AUTH_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  const { data: citizen } = await http.get<CitizensBasicInformationResponse>(
    `/${cedula}/info/basic?api-key=${process.env.CEDULA_API_KEY}`,
    {
      headers: {
        Authorization: `Bearer ${citizensToken.access_token}`,
      },
    }
  );

  const { names, id } = citizen.payload;
  const name = names.split(' ')[0];

  res.status(200).json({ name, id });
}
