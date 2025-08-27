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
    expect(
      screen.getByRole('heading', { name: /Origin Date/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Development Date/i }),
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
