import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Form } from '@/app/[lang]/identification/form';
import { identifyAccount } from '@/app/[lang]/identification/identify.action';
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
  vi.stubEnv('CEDULA_VALIDATION_API', '');
  vi.mocked(validateRecaptcha).mockResolvedValue({ isHuman: true });
  vi.mocked(findIamCitizen).mockResolvedValue({ exists: false });
  vi.mocked(findCitizen).mockRejectedValue(new Error('Citizens unavailable'));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

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

describe('identification citizen lookup', () => {
  it('stops before account lookup when all cedula validations fail', async () => {
    vi.stubEnv(
      'CEDULA_VALIDATION_API',
      'https://api.example.test/v3/cedulas',
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ valid: false })));
    vi.stubGlobal('fetch', fetchMock);

    renderForm();
    const confirmButton = screen.getByRole('button', {
      name: es.actions.confirm,
    }) as HTMLButtonElement;

    expect(confirmButton.disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.input(screen.getByRole('textbox'), {
      target: { value: '00000000001' },
    });

    await waitFor(() => expect(confirmButton.disabled).toBe(false));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(confirmButton);

    expect(await screen.findAllByText(es.errors.cedula.invalid)).toHaveLength(
      2,
    );
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(
      '000-0000000-1',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(validateRecaptcha).toHaveBeenCalledTimes(1);
    expect(findIamCitizen).not.toHaveBeenCalled();
    expect(findCitizen).not.toHaveBeenCalled();
  });

  it('revalidates the cedula in the server action', async () => {
    const form = new FormData();
    form.set('cedula', '00000000001');
    form.set('token', 'test-token');

    await expect(identifyAccount({ message: '' }, form)).resolves.toEqual({
      message: 'errors.cedula.invalid',
    });
    expect(validateRecaptcha).toHaveBeenCalledTimes(1);
    expect(findIamCitizen).not.toHaveBeenCalled();
    expect(findCitizen).not.toHaveBeenCalled();
  });

  it.each([es, en])(
    'shows an invalid ID error when the citizen does not exist in JCE in $language',
    async (intl) => {
      renderForm(intl);
      expect(screen.getByText(intl.step1.title)).toBeTruthy();
      await submitCedula(intl);

      expect((await screen.findByRole('alert')).textContent).toBe(
        intl.errors.cedula.invalid,
      );
      expect(screen.getByRole('textbox')).toBeTruthy();
      expect(screen.getByText(intl.step1.title)).toBeTruthy();
      expect(screen.getByText(intl.step1.description)).toBeTruthy();
      expect(
        screen.getByRole('button', { name: intl.actions.confirm }),
      ).toBeTruthy();
      expect(
        screen.getByRole('link', { name: intl.actions.loginHere }),
      ).toBeTruthy();
      expect(findCitizen).toHaveBeenCalledTimes(1);
      expect(setCookie).not.toHaveBeenCalled();
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
