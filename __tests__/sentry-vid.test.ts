import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import es from '@/dictionaries/es.json';
import en from '@/dictionaries/en.json';
import { GET } from '@/app/api/vid/route';

const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock('@/app/[lang]/vid/input.schema', () => ({
  createInputSchema: () => ({ safeParseAsync: parse }),
}));
vi.mock('@/dictionaries', () => ({
  getDictionary: async (lang: string) => (lang === 'en' ? en : es),
}));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());

function request(lang: string) {
  return new NextRequest(
    `http://localhost/api/vid?lang=${lang}&access_token=private-token&client_id=client-id&redirect_uri=https://example.test`,
  );
}

describe.each([
  ['es', es],
  ['en', en],
] as const)('VID telemetry in %s', (lang, intl) => {
  it.each([
    'invalidToken',
    'invalidClient',
    'invalidRedirectUri',
    'invalidParameters',
  ] as const)('keeps %s out of error events', async (key) => {
    parse.mockRejectedValueOnce(new Error(intl.errors.vid[key]));
    const response = await GET(request(lang));
    expect(response.status).toBe(307);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'vid_validation_rejected' }),
    );
    expect(
      JSON.stringify(vi.mocked(Sentry.addBreadcrumb).mock.calls),
    ).not.toContain('private-token');
  });
  it.each([
    intl.step2.unavailable,
    'Provider rejected 00000000001 test@example.test private-token',
  ])('retains service failures without leaking details', async (message) => {
    parse.mockRejectedValueOnce(new Error(message));
    const response = await GET(request(lang));
    expect(
      new URL(response.headers.get('location')!).searchParams.get('error'),
    ).toBe(
      message === intl.step2.unavailable
        ? intl.step2.unavailable
        : intl.errors.vid.invalidParameters,
    );
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'vid_flow_creation_failed',
      expect.objectContaining({ level: 'error' }),
    );
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    const payload = JSON.stringify(vi.mocked(Sentry.captureMessage).mock.calls);
    for (const value of ['00000000001', 'test@example.test', 'private-token'])
      expect(payload).not.toContain(value);
  });
});
