import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LivenessQuickStart } from '@/components/LivenessQuickStart';
import { LanguageProvider } from '@/app/[lang]/provider';
import es from '@/dictionaries/es.json';

vi.mock('@aws-amplify/ui-react-liveness', () => ({
  FaceLivenessDetector: ({ sessionId }: { sessionId: string }) => (
    <div>Session: {sessionId}</div>
  ),
}));
vi.mock('@aws-amplify/ui-react', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/common/helpers/amplify-client', () => ({
  configureAmplifyClient: vi.fn(),
}));
vi.mock('@/components/elements/alert', () => ({
  useSnackAlert: () => ({ AlertError: vi.fn(), AlertWarning: vi.fn() }),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ lang: 'es' }),
  useRouter: () => ({ push: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('starts loading, exposes retry after failure, and loads a new session on retry', async () => {
  let resolveRetry!: (response: Response) => void;
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveRetry = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(
    <LanguageProvider intl={es}>
      <LivenessQuickStart cedula="00000000000" source="registration" />
    </LanguageProvider>,
  );
  expect(screen.getByRole('progressbar')).toBeTruthy();
  const retry = await screen.findByRole('button');
  expect(retry.hasAttribute('disabled')).toBe(false);
  fireEvent.click(retry);
  expect(screen.getByRole('progressbar')).toBeTruthy();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  resolveRetry(
    new Response(
      JSON.stringify({ success: true, sessionId: 'retry-session' }),
      { status: 200 },
    ),
  );
  expect(await screen.findByText('Session: retry-session')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
});
