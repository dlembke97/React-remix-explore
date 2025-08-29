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
import TrianglesPage from '../_layout.triangles';
import { parseTrianglesCsv } from '../../utils/csv';

describe('Triangles', () => {
  it('renders Triangles page header', () => {
    render(
      <MemoryRouter>
        <TrianglesPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Triangles' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Origin Date' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Development Date' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Origin Date Aggregation' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Development Date Aggregation' }),
    ).toBeInTheDocument();
  });

  it('parses arbitrary dataset without enforcing headers', () => {
    const csv = `foo,bar\n1,baz\n2,qux`;
    expect(parseTrianglesCsv(csv)).toEqual([
      { foo: 1, bar: 'baz' },
      { foo: 2, bar: 'qux' },
    ]);
  });
});
