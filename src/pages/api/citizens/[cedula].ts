import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { CitizensBasicInformationResponse } from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ name: string; id: string } | void>
): Promise<void> {
  const { token } = req.cookies;

  if (token !== process.env.NEXT_PUBLIC_COOKIE_KEY) {
    return res.status(401).send();
  }

  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CEDULA_API,
  });

  const { cedula } = req.query;

  const { data: citizen } = await http.get<CitizensBasicInformationResponse>(
    `/${cedula}/info/basic?api-key=${process.env.NEXT_PUBLIC_CEDULA_API_KEY}`
  );

  const { names, id } = citizen.payload;
  const name = names.split(' ')[0];

  res.status(200).json({ name, id });
}
