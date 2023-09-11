import { render, screen } from '@testing-library/react';

import Register from '@/app/register';

describe('Index', () => {
  it('should render without crashing', () => {
    render(<Register />);

    expect(screen.getByRole('index')).toBeDefined();
    expect(12 * 12).toBe(144);
  });
});
