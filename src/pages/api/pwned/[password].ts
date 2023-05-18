import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse<[] | void>): Promise<void> {
  const { token } = req.cookies;

  if (token !== process.env.NEXT_PUBLIC_COOKIE_KEY) {
    return res.status(401).send();
  }

  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_PWNED_API,
  });

  const { password } = req.query;

  const { data } = await http.get<[]>(`/${password}`);

  res.status(200).json(data);
}
