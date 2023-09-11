import { render, screen } from '@testing-library/react';

import { ButtonApp, ButtonTextApp } from '@/components/elements/button';

describe('ButtonApp', () => {
  it('should render', () => {
    render(
      <>
        <ButtonApp>This is a button!</ButtonApp>
      </>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should render passed text', () => {
    render(
      <>
        <ButtonApp>This is a button!</ButtonApp>
      </>,
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('This is a button!');
  });
});

describe('ButtonTextApp', () => {
  it('should render', () => {
    render(
      <>
        <ButtonTextApp>This is a button!</ButtonTextApp>
      </>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should render passed text', () => {
    render(
      <>
        <ButtonTextApp>This is a button!</ButtonTextApp>
      </>,
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('This is a button!');
  });
});
