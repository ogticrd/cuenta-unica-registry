import type { CitizensTokenResponse } from '@/types';
import { unwrap } from './unwrap';

export const fetchCitizensAuthHeaders = async () =>
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
