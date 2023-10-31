'use server';

import {
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
  CitizensTokenResponse,
} from '../types';
import { unwrap } from '@/common/helpers';

const fetchAuthHeaders = async () =>
  fetch(process.env.CEDULA_TOKEN_API!, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${process.env.CITIZENS_API_AUTH_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-cache',
  })
    .then<CitizensTokenResponse>(unwrap)
    .then(({ access_token }) => ({
      Authorization: `Bearer ${access_token}`,
    }));

export async function findCitizen(cedula: string, validated?: boolean) {
  const baseURL = process.env.CEDULA_API!;
  const apiKey = process.env.CEDULA_API_KEY!;

  const headers = await fetchAuthHeaders();

  const citizenUrl = new URL(`${baseURL}/${cedula}/info/basic`);
  citizenUrl.searchParams.append('api-key', apiKey);
  const { payload: citizen } = await fetch(citizenUrl, {
    headers,
  }).then<CitizensBasicInformationResponse>(unwrap);

  const { names, id, firstSurname, secondSurname, gender } = citizen;

  if (validated) {
    const headers = await fetchAuthHeaders();
    const birthUrl = new URL(`${baseURL}/${cedula}/info/birth`);
    birthUrl.searchParams.append('api-key', apiKey);
    const { payload: birth } = await fetch(birthUrl, {
      headers,
    }).then<CitizensBirthInformationResponse>(unwrap);

    const [birthDate] = birth.birthDate.split('T');

    return {
      names,
      id,
      firstSurname,
      secondSurname,
      gender,
      birthDate,
    };
  }

  return {
    name: names.split(' ')[0],
    id,
  };
}
