import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import SnackAlert, { useSnackAlert } from '@/components/elements/alert';

afterEach(cleanup);

function Trigger() {
  const { AlertError } = useSnackAlert();

  return (
    <button onClick={() => AlertError('Face did not match')}>Show error</button>
  );
}

describe('SnackAlert', () => {
  it('closes an error and can show it again without crashing during the exit transition', async () => {
    render(
      <SnackAlert>
        <Trigger />
      </SnackAlert>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show error' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Face did not match',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show error' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Face did not match',
    );
  });
});
