import { NextRequest, NextResponse } from 'next/server';

import {
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
  CitizensTokenResponse,
} from '../../types';
import { CitizensDataFlow } from '../../types/citizens.type';

export async function GET(
  req: NextRequest,
  { params: { cedula } }: Props,
  res: NextResponse<CitizensDataFlow | void>,
): Promise<NextResponse> {
  const baseURL = process.env.CEDULA_API!;
  const apiKey = process.env.CEDULA_API_KEY!;

  const { access_token } = await fetchAccessToken();

  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  const citizenUrl = new URL(`${baseURL}/${cedula}/info/basic`);
  citizenUrl.searchParams.append('api-key', apiKey);
  const { payload: citizen } = await fetch(citizenUrl, {
    headers,
  }).then<CitizensBasicInformationResponse>((res) => res.json());

  const { names, id, firstSurname, secondSurname, gender } = citizen;

  const validated = new URL(req.url).searchParams.get('validated') === 'true';

  if (validated) {
    const birthUrl = new URL(`${baseURL}/${cedula}/info/birth`, baseURL);
    birthUrl.searchParams.append('api-key', apiKey);

    const { payload: birth } = await fetch(birthUrl, {
      headers,
    }).then<CitizensBirthInformationResponse>((r) => r.json());

    const [birthDate] = birth.birthDate.split('T');

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
    name: names.split(' ')[0],
    id,
  });
}

const fetchAccessToken = async () => {
  return fetch(process.env.CEDULA_TOKEN_API!, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${process.env.CITIZENS_API_AUTH_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then<CitizensTokenResponse>((res) => res.json());
};

type Props = { params: { cedula: string } };
