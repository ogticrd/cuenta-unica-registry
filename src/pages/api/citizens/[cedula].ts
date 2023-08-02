import { NextApiRequest, NextApiResponse } from 'next/types';
import axios from 'axios';

import {
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
  CitizensTokenResponse,
} from '../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    id: string;
    name?: string;
    names?: string;
    firstSurname?: string;
    secondSurname?: string;
    gender?: string;
    birthDate?: string;
  } | void>,
): Promise<void> {
  const { token } = req.cookies;

  if (token !== process.env.SITE_COOKIE_KEY) {
    return res.status(401).send();
  }

  const http = axios.create({
    baseURL: process.env.CEDULA_API,
  });

  const { cedula, validated } = req.query;

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
    },
  );

  const { data: citizen } = await http.get<CitizensBasicInformationResponse>(
    `/${cedula}/info/basic?api-key=${process.env.CEDULA_API_KEY}`,
    {
      headers: {
        Authorization: `Bearer ${citizensToken.access_token}`,
      },
    },
  );

  const { names, id, firstSurname, secondSurname, gender } = citizen.payload;
  const name = names.split(' ')[0];

  if (validated) {
    const { data: citizensBirthData } =
      await http.get<CitizensBirthInformationResponse>(
        `/${cedula}/info/birth?api-key=${process.env.CEDULA_API_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${citizensToken.access_token}`,
          },
        },
      );

    let { birthDate } = citizensBirthData.payload;
    birthDate = birthDate.split('T')[0];

    return res.status(200).json({
      names,
      id,
      firstSurname,
      secondSurname,
      gender,
      birthDate,
    });
  }

  return res.status(200).json({ name, id });
}
