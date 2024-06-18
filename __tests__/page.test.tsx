import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test('Page', () => {
  render(<h1 role="heading">Test</h1>);
  expect(screen.getByRole('heading').textContent).toBe('Test');
});
