import { render, screen } from '@testing-library/react';
import DashboardPage from '../_layout._index';
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

describe('Dashboard', () => {
  it('renders Dashboard page title', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /Dashboard/i }),
    ).toBeInTheDocument();
  });
});
