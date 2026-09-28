import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPhotoBuffer } from '@/app/[lang]/liveness/get-photo.action';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('liveness photo lookup', () => {
  it('sends the Citizens bearer token along with the photo API key', async () => {
    vi.stubEnv('CEDULA_TOKEN_API', 'https://auth.example.test/token');
    vi.stubEnv('CITIZENS_API_AUTH_KEY', 'test-client-credentials');
    vi.stubEnv('JCE_PHOTO_API', 'https://api.example.test/v3/citizens');
    vi.stubEnv('JCE_PHOTO_API_KEY', 'test-api-key');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'test-access-token' })),
      )
      .mockResolvedValueOnce(new Response('photo'));
    vi.stubGlobal('fetch', fetchMock);

    const photo = await fetchPhotoBuffer('00000000000');

    expect(new TextDecoder().decode(photo!)).toBe('photo');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [photoUrl, photoOptions] = fetchMock.mock.calls[1];
    expect(photoUrl.pathname).toBe('/v3/citizens/00000000000/photo');
    expect(photoUrl.searchParams.get('api-key')).toBe('test-api-key');
    expect(photoOptions.headers).toEqual({
      Authorization: 'Bearer test-access-token',
    });
  });

  it('keeps the unavailable state when the photo API rejects the request', async () => {
    vi.stubEnv('CEDULA_TOKEN_API', 'https://auth.example.test/token');
    vi.stubEnv('JCE_PHOTO_API', 'https://api.example.test/v3/citizens');
    vi.stubEnv('JCE_PHOTO_API_KEY', 'test-api-key');

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'test-access-token' })),
        )
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );

    await expect(fetchPhotoBuffer('00000000000')).resolves.toBeNull();
  });
});
