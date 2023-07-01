import { NextApiRequest, NextApiResponse } from 'next/types';
import cookie from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<void>
): Promise<any> {
  res.setHeader(
    'Set-cookie',
    cookie.serialize('token', process.env.SITE_COOKIE_KEY as string, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 10,
      sameSite: 'strict',
      path: '/',
    })
  );

  return res.status(200).send();
}
