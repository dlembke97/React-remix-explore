import { render, screen } from '@testing-library/react';
import AboutPage from '../_layout.about';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode, ComponentType } from 'react';

vi.mock('react-router', () => ({
  MemoryRouter: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  UNSAFE_withComponentProps: <T extends ComponentType>(Comp: T) => Comp,
}));

import { MemoryRouter } from 'react-router';

describe('About', () => {
  it('renders About page header', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /About/i })).toBeInTheDocument();
  });
});
