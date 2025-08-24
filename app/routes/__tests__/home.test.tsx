import { render, screen } from '@testing-library/react';
import Home from '../../components/Home';
import { describe, it, expect } from 'vitest';

describe('Home', () => {
  it('renders AntD button', () => {
    render(<Home />);
    expect(
      screen.getByRole('button', { name: /antd button/i }),
    ).toBeInTheDocument();
  });
});
