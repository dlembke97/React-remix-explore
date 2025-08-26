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
  useLoaderData: () => ({ triangles: [] }),
}));

import { MemoryRouter } from 'react-router';
import TrianglesPage, { parseTrianglesCsv } from '../_layout.triangles';

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

  it('parses minimal accidentYear-dev-paid dataset', () => {
    const csv = `accidentYear,dev,paid\n2020,1,1000\n2021,2,1500`;
    expect(parseTrianglesCsv(csv)).toEqual([
      {
        portfolio: '',
        lob: '',
        accidentYear: 2020,
        dev: 1,
        paid: 1000,
        incurred: 0,
      },
      {
        portfolio: '',
        lob: '',
        accidentYear: 2021,
        dev: 2,
        paid: 1500,
        incurred: 0,
      },
    ]);
  });
});
