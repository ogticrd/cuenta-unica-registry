import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import { VerifyIamUserNameResponse } from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ exists: boolean } | void>
): Promise<void> {
  const { token } = req.cookies;

  if (token !== process.env.NEXT_PUBLIC_COOKIE_KEY) {
    return res.status(401).send();
  }

  const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_IAM_API,
  });

  const { cedula } = req.query;

  const { data } = await http.get<VerifyIamUserNameResponse>(
    `auth/validations/users/existence?username=${cedula}`
  );

  const { exists } = data.data;

  res.status(200).json({ exists });
}
