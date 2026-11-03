import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Form } from '@/app/[lang]/verification/form';
import { verifyAccount } from '@/app/[lang]/verification/verify.action';
import { LanguageProvider } from '@/app/[lang]/provider';
import SnackAlert from '@/components/elements/alert';
import es from '@/dictionaries/es.json';

vi.mock('@/app/[lang]/verification/verify.action', () => ({
  verifyAccount: vi.fn(),
}));
vi.mock('next/font/google', () => ({
  Poppins: () => ({ style: { fontFamily: 'Poppins' } }),
}));
vi.mock(
  '@/common/helpers',
  async () => import('@/common/helpers/localize-string'),
);
afterEach(cleanup);

it('submits updated codes, moves focus, and shows repeated server errors after editing', async () => {
  vi.mocked(verifyAccount).mockImplementation(async () => ({
    message: 'errors.code.invalidOrUsed',
  }));
  const { container } = render(
    <LanguageProvider intl={es}>
      <SnackAlert>
        <Form flow="test-flow" />
      </SnackAlert>
    </LanguageProvider>,
  );
  const inputs = screen.getAllByRole('textbox');
  for (const [index, value] of [...'123456'].entries()) {
    fireEvent.change(inputs[index], { target: { value } });
    if (index < 5) expect(document.activeElement).toBe(inputs[index + 1]);
  }
  const form = container.querySelector('form')!;
  await waitFor(() => expect(new FormData(form).get('code')).toBe('123456'));
  fireEvent.submit(form);
  await waitFor(() =>
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true'),
  );
  expect(vi.mocked(verifyAccount).mock.calls[0][1].get('code')).toBe('123456');
  fireEvent.change(inputs[0], { target: { value: '9' } });
  expect(inputs[0].getAttribute('aria-invalid')).toBe('false');
  await waitFor(() => expect(new FormData(form).get('code')).toBe('923456'));
  fireEvent.submit(form);
  await waitFor(() => expect(verifyAccount).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(inputs[0].getAttribute('aria-invalid')).toBe('true'),
  );
  expect(vi.mocked(verifyAccount).mock.calls[1][1].get('code')).toBe('923456');
});
