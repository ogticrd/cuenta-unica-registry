import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Form } from '@/app/[lang]/identification/form';
import { Form as RecoveryForm } from '@/app/[lang]/account-recovery/form';
import { identifyAccount } from '@/app/[lang]/identification/identify.action';
import { LanguageProvider } from '@/app/[lang]/provider';
import SnackAlert from '@/components/elements/alert';
import {
  findCitizen,
  findIamCitizen,
  findIamCitizenForRecovery,
  setCookie,
  validateRecaptcha,
} from '@/actions';
import { useCedulaForm } from '@/hooks/useCedulaForm';
import es from '@/dictionaries/es.json';
import en from '@/dictionaries/en.json';

vi.mock('@/actions/recaptcha.action', () => ({ validateRecaptcha: vi.fn() }));
vi.mock('@/actions', async () => ({
  findCitizen: vi.fn(),
  findIamCitizen: vi.fn(),
  findIamCitizenForRecovery: vi.fn(),
  setRecoverySession: vi.fn(),
  setCookie: vi.fn(),
  validateRecaptcha: (await import('@/actions/recaptcha.action'))
    .validateRecaptcha,
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/font/google', () => ({
  Poppins: () => ({ style: { fontFamily: 'Poppins' } }),
}));
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }));
const captcha = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('next-recaptcha-v3', () => ({
  useReCaptcha: () => ({
    loaded: true,
    executeRecaptcha: captcha.execute,
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
  vi.stubEnv('SITE_COOKIE_KEY', 'test-signing-key');
  vi.stubEnv('NEXT_PUBLIC_LUHN_EXCEPTION_HASHES', '');
  let counter = 0;
  captcha.execute.mockImplementation(async () => `test-token-${++counter}`);
  vi.mocked(findIamCitizenForRecovery).mockResolvedValue({
    exists: true,
    identities: [],
  });
  vi.mocked(validateRecaptcha).mockResolvedValue({ isHuman: true });
  vi.mocked(findIamCitizen).mockResolvedValue({ exists: false });
  vi.mocked(findCitizen).mockRejectedValue(new Error('Citizens unavailable'));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function renderForm(intl = es, Component = Form) {
  return render(
    <LanguageProvider intl={intl}>
      <SnackAlert>
        <Component />
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
    ).toMatch(/^test-token-/);
  });
  const submit = screen.getByRole('button', {
    name: intl.actions.confirm,
  }) as HTMLButtonElement;
  await waitFor(() => expect(submit.disabled).toBe(false));
  fireEvent.click(submit);
}

describe('identification outage state', () => {
  it('revalidates the cedula in the server action', async () => {
    const form = new FormData();
    form.set('cedula', 'invalid');
    form.set('token', 'test-token');

    await expect(identifyAccount({ message: '' }, form)).resolves.toEqual({
      message: 'errors.cedula.invalid',
    });
    expect(validateRecaptcha).toHaveBeenCalledTimes(1);
    expect(findIamCitizen).not.toHaveBeenCalled();
    expect(findCitizen).not.toHaveBeenCalled();
  });

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

it.each([
  ['identification', Form],
  ['recovery', RecoveryForm],
] as const)(
  'does not reuse a cached CAPTCHA when generating a new one fails in %s',
  async (_, Component) => {
    renderForm(es, Component);
    await waitFor(() => {
      expect(
        document.querySelector<HTMLInputElement>('input[name="token"]')?.value,
      ).toMatch(/^test-token-/);
    });
    captcha.execute.mockRejectedValue(new Error('CAPTCHA unavailable'));
    fireEvent.input(screen.getByRole('textbox'), {
      target: { value: '00000000000' },
    });
    const label =
      Component === Form
        ? es.actions.confirm
        : es.accountRecovery.startRecovery;
    const button = screen.getByRole('button', {
      name: label,
    }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    fireEvent.click(button);
    expect((await screen.findByRole('alert')).textContent).toBe(
      es.errors.recaptcha.issues,
    );
    expect(validateRecaptcha).not.toHaveBeenCalled();
    expect(findIamCitizen).not.toHaveBeenCalled();
    expect(findIamCitizenForRecovery).not.toHaveBeenCalled();
  },
);

const forms = [
  ['identification', Form],
  ['recovery', RecoveryForm],
] as const;
function confirmFor(Component: typeof Form) {
  return screen.getByRole('button', {
    name:
      Component === Form
        ? es.actions.confirm
        : es.accountRecovery.startRecovery,
  }) as HTMLButtonElement;
}
function enter(cedula: string) {
  fireEvent.input(screen.getByRole('textbox'), { target: { value: cedula } });
}

it.each(forms)(
  'validates on the 11th digit and blocks rejected exceptions in %s',
  async (_, Component) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const lookup = vi
      .fn()
      .mockImplementation(async () => Response.json({ valid: false }));
    vi.stubGlobal('fetch', lookup);
    renderForm(es, Component);
    enter('0000000000');
    expect(confirmFor(Component).disabled).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
    enter('00000000001');
    expect(confirmFor(Component).disabled).toBe(true);
    expect(await screen.findByText(es.errors.cedula.invalid)).toBeTruthy();
    expect(confirmFor(Component).disabled).toBe(true);
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(
      '000-0000000-1',
    );
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(findIamCitizen).not.toHaveBeenCalled();
    expect(findIamCitizenForRecovery).not.toHaveBeenCalled();
    expect(findCitizen).not.toHaveBeenCalled();
  },
);

it.each(forms)(
  'uses no remote validation for local passes in %s',
  async (_, Component) => {
    const lookup = vi.fn();
    vi.stubGlobal('fetch', lookup);
    renderForm(es, Component);
    enter('00000000000');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(lookup).not.toHaveBeenCalled();
    expect(validateRecaptcha).not.toHaveBeenCalled();
    vi.stubEnv(
      'NEXT_PUBLIC_LUHN_EXCEPTION_HASHES',
      '031f50e5e09a5f61b2da02c2f59fde68fba579de4e1ef7a5490d6425f810977e',
    );
    enter('00000000001');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(lookup).not.toHaveBeenCalled();
    expect(validateRecaptcha).not.toHaveBeenCalled();
  },
);

it.each(forms)(
  'accepts a remote exception without a second metered lookup on submit in %s',
  async (_, Component) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const lookup = vi
      .fn()
      .mockImplementation(async () => Response.json({ valid: true }));
    vi.stubGlobal('fetch', lookup);
    const usedTokens = new Set<string>();
    vi.mocked(validateRecaptcha).mockImplementation(async (token) => {
      const isHuman = !usedTokens.has(token);
      usedTokens.add(token);
      return { isHuman };
    });
    renderForm(es, Component);
    enter('00000000001');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(lookup).toHaveBeenCalledTimes(1);
    fireEvent.click(confirmFor(Component));
    await waitFor(() => expect(findCitizen).toHaveBeenCalledTimes(1));
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(usedTokens.size).toBe(2);
  },
);

it.each(forms)(
  'refreshes an expired exception approval once before submitting in %s',
  async (_, Component) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const lookup = vi
      .fn()
      .mockImplementation(async () => Response.json({ valid: true }));
    vi.stubGlobal('fetch', lookup);
    renderForm(es, Component);
    enter('00000000001');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(lookup).toHaveBeenCalledTimes(1);
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60_000);
    try {
      fireEvent.click(confirmFor(Component));
      await waitFor(() => expect(findCitizen).toHaveBeenCalledTimes(1));
      expect(lookup).toHaveBeenCalledTimes(2);
    } finally {
      now.mockRestore();
    }
  },
);

it.each(forms)(
  'keeps the field blocked during an outage and allows retry in %s',
  async (_, Component) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const lookup = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Offline'))
      .mockImplementation(async () => Response.json({ valid: true }));
    vi.stubGlobal('fetch', lookup);
    renderForm(es, Component);
    enter('00000000001');
    expect(await screen.findByText(es.errors.cedula.invalid)).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe(
      '000-0000000-1',
    );
    expect(confirmFor(Component).disabled).toBe(true);
    expect(findCitizen).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: es.actions.retry })).toBeNull();
    fireEvent.click(
      await screen.findByRole(
        'button',
        { name: es.actions.retry },
        { timeout: 3_000 },
      ),
    );
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(es.errors.cedula.invalid)).toBeNull();
  },
);

it('keeps the invalid message when the exception endpoint is not configured', async () => {
  const lookup = vi.fn();
  vi.stubGlobal('fetch', lookup);
  renderForm();
  enter('00000000001');
  expect(await screen.findByText(es.errors.cedula.invalid)).toBeTruthy();
  expect(confirmFor(Form).disabled).toBe(true);
  expect(lookup).not.toHaveBeenCalled();
  expect(findCitizen).not.toHaveBeenCalled();
});

it.each(forms)(
  'ignores a stale exception response after editing the ID in %s',
  async (_, Component) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    let resolve!: (response: Response) => void;
    const lookup = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal('fetch', lookup);
    renderForm(es, Component);
    enter('00000000001');
    await waitFor(() => expect(lookup).toHaveBeenCalledTimes(1));
    expect(confirmFor(Component).disabled).toBe(true);
    enter('00000000000');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    await act(async () => {
      resolve(Response.json({ valid: false }));
    });
    expect(confirmFor(Component).disabled).toBe(false);
    expect(screen.queryByText(es.errors.cedula.invalid)).toBeNull();
    expect(
      document.querySelector<HTMLInputElement>('input[name="cedulaValidation"]')
        ?.value,
    ).toBe('');
  },
);

it('backs off failed retries exponentially, caps the delay, and resets after a response', async () => {
  vi.useFakeTimers();
  try {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const lookup = vi.fn().mockRejectedValue(new TypeError('Offline'));
    vi.stubGlobal('fetch', lookup);
    const { result } = renderHook(() => useCedulaForm(es));
    await act(async () => {
      await result.current.validateInput('00000000001');
    });
    let calls = 1;
    for (const delay of [2_000, 4_000, 8_000, 16_000, 30_000, 30_000]) {
      expect(result.current.canRetryCedula).toBe(false);
      await act(async () => {
        await result.current.validateInput('00000000001', true);
      });
      expect(lookup).toHaveBeenCalledTimes(calls);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(delay - 1);
      });
      expect(result.current.canRetryCedula).toBe(false);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(result.current.canRetryCedula).toBe(true);
      await act(async () => {
        await result.current.validateInput('00000000001', true);
      });
      expect(lookup).toHaveBeenCalledTimes(++calls);
    }
    lookup.mockImplementationOnce(async () => Response.json({ valid: false }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    await act(async () => {
      await result.current.validateInput('00000000001', true);
    });
    expect(result.current.canRetryCedula).toBe(false);
    await act(async () => {
      await result.current.validateInput('00000000002');
    });
    expect(result.current.canRetryCedula).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.canRetryCedula).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

it('preserves the retry cooldown through edits while allowing local validation', async () => {
  vi.useFakeTimers();
  try {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    const lookup = vi.fn().mockRejectedValue(new TypeError('Offline'));
    vi.stubGlobal('fetch', lookup);
    const { result } = renderHook(() => useCedulaForm(es));
    await act(async () => {
      await result.current.validateInput('00000000001');
    });
    await act(async () => {
      await result.current.validateInput('00000000000');
    });
    expect(result.current.canSubmitCedula).toBe(true);
    await act(async () => {
      await result.current.validateInput('00000000002');
    });
    expect(result.current.canSubmitCedula).toBe(false);
    expect(result.current.canRetryCedula).toBe(false);
    expect(lookup).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.canRetryCedula).toBe(true);
    await act(async () => {
      await result.current.validateInput('00000000002', true);
    });
    expect(lookup).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_999);
    });
    expect(result.current.canRetryCedula).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.canRetryCedula).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});

it('reuses a pending approval after deleting and restoring the last digit', async () => {
  vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
  let resolve!: (response: Response) => void;
  const lookup = vi.fn().mockImplementation(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  vi.stubGlobal('fetch', lookup);
  const { result } = renderHook(() => useCedulaForm(es));
  let first!: Promise<boolean>;
  let restored!: Promise<boolean>;
  await act(async () => {
    first = result.current.validateInput('00000000001');
  });
  await waitFor(() => expect(lookup).toHaveBeenCalledTimes(1));
  await act(async () => {
    await result.current.validateInput('0000000000');
  });
  await act(async () => {
    restored = result.current.validateInput('00000000001');
  });
  expect(result.current.checkingCedula).toBe(true);
  await act(async () => {
    resolve(Response.json({ valid: true }));
    await Promise.all([first, restored]);
  });
  expect(result.current.canSubmitCedula).toBe(true);
  expect(result.current.cedulaReceipt).not.toBe('');
  expect(lookup).toHaveBeenCalledTimes(1);
});

it('queues only the latest different ID behind the active lookup', async () => {
  vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
  let resolve!: (response: Response) => void;
  const lookup = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    )
    .mockImplementation(async () => Response.json({ valid: true }));
  vi.stubGlobal('fetch', lookup);
  const { result } = renderHook(() => useCedulaForm(es));
  let first!: Promise<boolean>;
  let intermediate!: Promise<boolean>;
  let latest!: Promise<boolean>;
  await act(async () => {
    first = result.current.validateInput('00000000001');
  });
  await waitFor(() => expect(lookup).toHaveBeenCalledTimes(1));
  await act(async () => {
    intermediate = result.current.validateInput('00000000002');
  });
  await act(async () => {
    latest = result.current.validateInput('00000000003');
  });
  expect(lookup).toHaveBeenCalledTimes(1);
  expect(result.current.checkingCedula).toBe(true);
  await act(async () => {
    resolve(Response.json({ valid: false }));
    await Promise.all([first, intermediate, latest]);
  });
  expect(lookup).toHaveBeenCalledTimes(2);
  expect(lookup.mock.calls[1][0].pathname).toBe(
    '/v3/cedulas/00000000003/validate',
  );
  expect(result.current.canSubmitCedula).toBe(true);
  expect(result.current.cedulaReceipt).not.toBe('');
});

it('applies the failure cooldown before checking a queued ID', async () => {
  vi.useFakeTimers();
  try {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    let reject!: (error: Error) => void;
    const lookup = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((_, fail) => {
            reject = fail;
          }),
      )
      .mockImplementation(async () => Response.json({ valid: true }));
    vi.stubGlobal('fetch', lookup);
    const { result } = renderHook(() => useCedulaForm(es));
    let first!: Promise<boolean>;
    let queued!: Promise<boolean>;
    await act(async () => {
      first = result.current.validateInput('00000000001');
    });
    expect(lookup).toHaveBeenCalledTimes(1);
    await act(async () => {
      queued = result.current.validateInput('00000000002');
    });
    await act(async () => {
      reject(new TypeError('Offline'));
      await Promise.all([first, queued]);
    });
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(result.current.canRetryCedula).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.canRetryCedula).toBe(true);
    await act(async () => {
      await result.current.validateInput('00000000002', true);
    });
    expect(result.current.canSubmitCedula).toBe(true);
    expect(lookup).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});

it.each(forms)(
  'cancels a stale submission after editing during CAPTCHA in %s',
  async (_, Component) => {
    vi.stubEnv('CEDULA_VALIDATION_API', 'https://api.example.test/v3/cedulas');
    let resolve!: (response: Response) => void;
    const lookup = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    vi.stubGlobal('fetch', lookup);
    renderForm(es, Component);
    await waitFor(() => expect(captcha.execute).toHaveBeenCalledTimes(1));
    enter('00000000000');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    let resolveToken!: (token: string) => void;
    captcha.execute.mockImplementationOnce(
      () =>
        new Promise<string>((done) => {
          resolveToken = done;
        }),
    );
    fireEvent.click(confirmFor(Component));
    await waitFor(() => expect(captcha.execute).toHaveBeenCalledTimes(2));
    enter('00000000001');
    await waitFor(() => expect(lookup).toHaveBeenCalledTimes(1));
    await act(async () => {
      resolveToken('submit-token');
      resolve(Response.json({ valid: true }));
    });
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(findCitizen).not.toHaveBeenCalled();
    expect(validateRecaptcha).toHaveBeenCalledTimes(1);
    fireEvent.click(confirmFor(Component));
    await waitFor(() => expect(findCitizen).toHaveBeenCalledTimes(1));
    expect(lookup).toHaveBeenCalledTimes(1);
  },
);

it.each(forms)(
  'cancels submission even if the ID is restored during CAPTCHA in %s',
  async (_, Component) => {
    renderForm(es, Component);
    await waitFor(() => expect(captcha.execute).toHaveBeenCalledTimes(1));
    enter('00000000000');
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    let resolveToken!: (token: string) => void;
    captcha.execute.mockImplementationOnce(
      () =>
        new Promise<string>((done) => {
          resolveToken = done;
        }),
    );
    fireEvent.click(confirmFor(Component));
    await waitFor(() => expect(captcha.execute).toHaveBeenCalledTimes(2));
    enter('0000000000');
    enter('00000000000');
    await act(async () => {
      resolveToken('submit-token');
    });
    await waitFor(() => expect(confirmFor(Component).disabled).toBe(false));
    expect(findCitizen).not.toHaveBeenCalled();
    expect(validateRecaptcha).not.toHaveBeenCalled();
    fireEvent.click(confirmFor(Component));
    await waitFor(() => expect(findCitizen).toHaveBeenCalledTimes(1));
  },
);
