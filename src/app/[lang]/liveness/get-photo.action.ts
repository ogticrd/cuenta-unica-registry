'use server';

export const fetchPhotoBuffer = async (cedula: string) => {
  const photoUrl = new URL(`${process.env.JCE_PHOTO_API!}/${cedula}/photo`);
  photoUrl.searchParams.append('api-key', process.env.JCE_PHOTO_API_KEY!);

  return fetch(photoUrl)
    .then((res) => (res.ok ? res.arrayBuffer() : null))
    .catch(() => null);
};
