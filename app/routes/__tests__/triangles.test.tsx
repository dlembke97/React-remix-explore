import { render, screen } from '@testing-library/react';
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
  useLoaderData: () => ({
    triangles: [
      {
        portfolio: 'Alpha',
        lob: 'D&O',
        accidentYear: 2020,
        dev: 12,
        paid: 1000,
        incurred: 1200,
      },
    ],
  }),
}));

import { MemoryRouter } from 'react-router';
import TrianglesPage from '../_layout.triangles';

describe('Triangles', () => {
  it('renders Triangles page header', () => {
    render(
      <MemoryRouter>
        <TrianglesPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /Triangles/i }),
    ).toBeInTheDocument();
  });
});
