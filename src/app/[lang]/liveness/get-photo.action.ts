'use server';

import { fetchCitizensAuthHeaders } from '@/common/helpers/citizens-auth';

export const fetchPhotoBuffer = async (cedula: string) => {
  const photoUrl = new URL(`${process.env.JCE_PHOTO_API!}/${cedula}/photo`);
  photoUrl.searchParams.append('api-key', process.env.JCE_PHOTO_API_KEY!);

  try {
    const headers = await fetchCitizensAuthHeaders();
    const response = await fetch(photoUrl, { headers });

    return response.ok ? response.arrayBuffer() : null;
  } catch {
    return null;
  }
};
