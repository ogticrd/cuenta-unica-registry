import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import UserFeedbackModal from '@/components/UserFeedbackModal';
import { LanguageProvider } from '@/app/[lang]/provider';
import es from '@/dictionaries/es.json';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  captureFeedback: vi.fn(),
}));
vi.mock('next/font/google', () => ({
  Poppins: () => ({ style: { fontFamily: 'Poppins' } }),
}));
afterEach(() => cleanup());

it('preserves all feedback values without a synthetic error event', async () => {
  render(
    <LanguageProvider intl={es}>
      <UserFeedbackModal open onClose={vi.fn()} />
    </LanguageProvider>,
  );
  fireEvent.input(screen.getByRole('textbox', { name: es.bug.cedula }), {
    target: { value: '00000000001' },
  });
  fireEvent.change(
    screen.getByRole('textbox', { name: es.step3.email.label }),
    { target: { value: 'test@example.test' } },
  );
  fireEvent.change(screen.getByRole('textbox', { name: es.bug.name }), {
    target: { value: 'Test Reporter' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: es.bug.comments }), {
    target: { value: 'The page did not load.' },
  });
  fireEvent.click(screen.getByRole('button', { name: es.bug.report }));
  await waitFor(() => expect(Sentry.captureFeedback).toHaveBeenCalledTimes(1));
  expect(Sentry.captureFeedback).toHaveBeenCalledWith({
    name: 'Test Reporter',
    email: 'test@example.test',
    message: 'The page did not load.',
    tags: { cedula: '00000000001' },
  });
  expect(Sentry.captureMessage).not.toHaveBeenCalled();
});
