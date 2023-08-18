import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import {
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
  CitizensTokenResponse,
} from '../../types';
import { boolean } from 'yup';

export async function GET(
  req: NextRequest,
  { params }: { params: { cedula: string; validated: boolean } },
  res: NextResponse<{
    id: string;
    name?: string;
    names?: string;
    firstSurname?: string;
    secondSurname?: string;
    gender?: string;
    birthDate?: string;
  } | void>,
): Promise<NextResponse> {
  const http = axios.create({
    baseURL: process.env.CEDULA_API,
  });

  const { validated, cedula } = params;

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

    return NextResponse.json({
      names,
      id,
      firstSurname,
      secondSurname,
      gender,
      birthDate,
    });
  }

  return NextResponse.json({
    name,
    id,
  });
}
