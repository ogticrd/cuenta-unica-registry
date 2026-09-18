import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Form } from '@/app/[lang]/identification/form';
import { LanguageProvider } from '@/app/[lang]/provider';
import SnackAlert from '@/components/elements/alert';
import {
  findCitizen,
  findIamCitizen,
  setCookie,
  validateRecaptcha,
} from '@/actions';
import es from '@/dictionaries/es.json';
import en from '@/dictionaries/en.json';

vi.mock('@/actions', () => ({
  findCitizen: vi.fn(),
  findIamCitizen: vi.fn(),
  setCookie: vi.fn(),
  validateRecaptcha: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/font/google', () => ({
  Poppins: () => ({ style: { fontFamily: 'Poppins' } }),
}));
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }));
vi.mock('next-recaptcha-v3', () => ({
  useReCaptcha: () => ({
    loaded: true,
    executeRecaptcha: async () => 'test-token',
  }),
}));

// Keep browser validation/localization real without initializing AWS clients.
vi.mock('@/common/helpers', async () => ({
  ...(await import('@/common/helpers/localize-string')),
  ...(await import('@/common/helpers/validations')),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(validateRecaptcha).mockResolvedValue({ isHuman: true });
  vi.mocked(findIamCitizen).mockResolvedValue({ exists: false });
  vi.mocked(findCitizen).mockRejectedValue(new Error('Citizens unavailable'));
});

afterEach(cleanup);

function renderForm(intl = es) {
  return render(
    <LanguageProvider intl={intl}>
      <SnackAlert>
        <Form />
      </SnackAlert>
    </LanguageProvider>,
  );
}

async function submitCedula(intl = es) {
  // Synthetic checksum-valid number; all external services are mocked.
  fireEvent.input(screen.getByRole('textbox'), {
    target: { value: '00000000000' },
  });
  await waitFor(() => {
    expect(
      document.querySelector<HTMLInputElement>('input[name="token"]')?.value,
    ).toBe('test-token');
  });
  fireEvent.click(screen.getByRole('button', { name: intl.actions.confirm }));
}

describe('identification outage state', () => {
  it.each([es, en])(
    'replaces the whole form without a toast in $language',
    async (intl) => {
      renderForm(intl);
      expect(screen.getByText(intl.step1.title)).toBeTruthy();
      await submitCedula(intl);

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).toBeNull();
      });
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.getByRole('alert').textContent).toBe(
        intl.step2.unavailable,
      );
      expect(document.querySelector('.MuiSnackbar-root')).toBeNull();
      expect(screen.queryByText(intl.step1.title)).toBeNull();
      expect(screen.queryByText(intl.step1.description)).toBeNull();
      expect(
        screen.queryByRole('button', { name: intl.actions.confirm }),
      ).toBeNull();
      expect(
        screen.queryByRole('link', { name: intl.actions.loginHere }),
      ).toBeNull();
      expect(findCitizen).toHaveBeenCalledTimes(1);
      expect(setCookie).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: intl.actions.retry }));
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByRole('textbox')).toBeTruthy();
      expect(screen.getByText(intl.step1.title)).toBeTruthy();
      expect(findCitizen).toHaveBeenCalledTimes(1);

      await submitCedula(intl);
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).toBeNull();
      });
      expect(screen.getByRole('alert').textContent).toBe(
        intl.step2.unavailable,
      );
      expect(findCitizen).toHaveBeenCalledTimes(2);
    },
  );

  it('keeps the form available for a reCAPTCHA validation error', async () => {
    vi.mocked(validateRecaptcha).mockResolvedValue({ isHuman: false });
    renderForm();
    await submitCedula();

    expect((await screen.findByRole('alert')).textContent).toBe(
      es.errors.recaptcha.validation,
    );
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByText(es.step1.title)).toBeTruthy();
    expect(findCitizen).not.toHaveBeenCalled();
  });
});
