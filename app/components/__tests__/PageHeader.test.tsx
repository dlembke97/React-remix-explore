import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

import PageHeader, { bc } from '../PageHeader';

describe('PageHeader', () => {
  it('renders the provided title', () => {
    render(<PageHeader title="Test Title" />);
    expect(
      screen.getByRole('heading', { name: /Test Title/i }),
    ).toBeInTheDocument();
  });

  it('renders breadcrumb links using the bc helper', () => {
    const breadcrumb = { items: [bc('/', 'Home'), { title: 'Current' }] };
    render(<PageHeader title="Current" breadcrumb={breadcrumb} />);
    const link = screen.getByRole('link', { name: /Home/i });
    expect(link).toHaveAttribute('href', '/');
  });
});
