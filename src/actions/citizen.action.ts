'use server';

import {
  CitizensBasicInformationResponse,
  CitizensBirthInformationResponse,
} from '../types';
import { unwrap } from '@/common/helpers/unwrap';
import { fetchCitizensAuthHeaders } from '@/common/helpers/citizens-auth';

export async function findCitizen(cedula: string, validated?: boolean) {
  const baseURL = process.env.CEDULA_API ?? process.env.CITIZENS_API_BASE_URL!;
  const apiKey =
    process.env.CEDULA_API_KEY ?? process.env.CITIZENS_INFO_API_KEY!;

  const headers =
    process.env.CEDULA_TOKEN_API && process.env.CITIZENS_API_AUTH_KEY
      ? await fetchCitizensAuthHeaders()
      : {};

  const citizenUrl = new URL(`${baseURL}/${cedula}/info/basic`);
  citizenUrl.searchParams.append('api-key', apiKey);
  const { payload: citizen } = await fetch(citizenUrl, {
    headers,
  }).then<CitizensBasicInformationResponse>(unwrap);

  const { names, id, firstSurname, secondSurname, gender } = citizen;

  if (validated) {
    const headers =
      process.env.CEDULA_TOKEN_API && process.env.CITIZENS_API_AUTH_KEY
        ? await fetchCitizensAuthHeaders()
        : {};
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
