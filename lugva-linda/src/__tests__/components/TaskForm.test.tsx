import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskForm } from '../../components/tasks/TaskForm';

describe('TaskForm', () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
    onCancel.mockReset();
  });

  it('renders title input', () => {
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByLabelText(/title/i)).toBeDefined();
  });

  it('shows validation error when title is empty', () => {
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(screen.getByText(/title is required/i)).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data', () => {
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'My new task' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My new task' })
    );
  });

  it('calls onCancel when cancel is clicked', () => {
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('pre-fills form when editing an existing task', () => {
    const task = {
      id: '1',
      title: 'Existing task',
      description: 'Some details',
      priority: 'high' as const,
      status: 'in-progress' as const,
      tags: ['tag1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    render(<TaskForm initial={task} onSubmit={onSubmit} onCancel={onCancel} />);
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Existing task');
  });
});
