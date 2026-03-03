import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../../store/taskStore';

describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      filterStatus: 'all',
      filterPriority: 'all',
      searchQuery: '',
    });
  });

  it('adds a task', () => {
    const { addTask } = useTaskStore.getState();
    addTask({
      title: 'Test Task',
      description: 'A test',
      priority: 'medium',
      status: 'todo',
      tags: ['test'],
    });
    const { tasks } = useTaskStore.getState();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].id).toBeDefined();
  });

  it('updates a task', () => {
    const { addTask, updateTask } = useTaskStore.getState();
    addTask({
      title: 'Original',
      description: '',
      priority: 'low',
      status: 'todo',
      tags: [],
    });
    const id = useTaskStore.getState().tasks[0].id;
    updateTask(id, { title: 'Updated', status: 'done' });
    const updated = useTaskStore.getState().tasks[0];
    expect(updated.title).toBe('Updated');
    expect(updated.status).toBe('done');
  });

  it('deletes a task', () => {
    const { addTask, deleteTask } = useTaskStore.getState();
    addTask({
      title: 'To delete',
      description: '',
      priority: 'low',
      status: 'todo',
      tags: [],
    });
    const id = useTaskStore.getState().tasks[0].id;
    deleteTask(id);
    expect(useTaskStore.getState().tasks).toHaveLength(0);
  });

  it('computes stats', () => {
    const { addTask, getStats } = useTaskStore.getState();
    addTask({ title: 'A', description: '', priority: 'low', status: 'todo', tags: [] });
    addTask({ title: 'B', description: '', priority: 'low', status: 'in-progress', tags: [] });
    addTask({ title: 'C', description: '', priority: 'low', status: 'done', tags: [] });

    const stats = getStats();
    expect(stats.total).toBe(3);
    expect(stats.todo).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.done).toBe(1);
  });

  it('filters tasks by status', () => {
    const { addTask, setFilterStatus, getFilteredTasks } = useTaskStore.getState();
    addTask({ title: 'Todo task', description: '', priority: 'low', status: 'todo', tags: [] });
    addTask({ title: 'Done task', description: '', priority: 'low', status: 'done', tags: [] });

    setFilterStatus('todo');
    const filtered = getFilteredTasks();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Todo task');
  });

  it('filters tasks by search query', () => {
    const { addTask, setSearchQuery, getFilteredTasks } = useTaskStore.getState();
    addTask({ title: 'Fix login bug', description: '', priority: 'high', status: 'todo', tags: [] });
    addTask({ title: 'Write docs', description: '', priority: 'low', status: 'todo', tags: [] });

    setSearchQuery('login');
    const filtered = getFilteredTasks();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Fix login bug');
  });
});
