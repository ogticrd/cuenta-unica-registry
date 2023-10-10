import { NextRequest, NextResponse } from 'next/server';

import {
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
  CitizensTokenResponse,
} from '../../types';
import { CitizensDataFlow } from '../../types/citizens.type';
import { unwrap } from '@/helpers';

export async function GET(
  req: NextRequest,
  { params: { cedula } }: Props,
  res: NextResponse<CitizensDataFlow | Pick<CitizensDataFlow, 'id' | 'name'>>,
) {
  const baseURL = process.env.CEDULA_API!;
  const apiKey = process.env.CEDULA_API_KEY!;

  const headers = await fetchAuthHeaders();

  const citizenUrl = new URL(`${baseURL}/${cedula}/info/basic`);
  citizenUrl.searchParams.append('api-key', apiKey);
  const { payload: citizen } = await fetch(citizenUrl, {
    headers,
  }).then<CitizensBasicInformationResponse>(unwrap);

  const { names, id, firstSurname, secondSurname, gender } = citizen;

  const validated = new URL(req.url).searchParams.get('validated') === 'true';

  if (validated) {
    const headers = await fetchAuthHeaders();
    const birthUrl = new URL(`${baseURL}/${cedula}/info/birth`);
    birthUrl.searchParams.append('api-key', apiKey);
    const { payload: birth } = await fetch(birthUrl, {
      headers,
    }).then<CitizensBirthInformationResponse>(unwrap);

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

const fetchAuthHeaders = async () =>
  fetch(process.env.CEDULA_TOKEN_API!, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${process.env.CITIZENS_API_AUTH_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then<CitizensTokenResponse>(unwrap)
    .then(({ access_token }) => ({
      Authorization: `Bearer ${access_token}`,
    }));

type Props = { params: { cedula: string } };
