import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/Badge';

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge variant="priority-high" label="high" />);
    expect(screen.getByText('high')).toBeDefined();
  });

  it('renders with correct variant class', () => {
    const { container } = render(<Badge variant="status-done" label="Done" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('status-done');
  });
});
