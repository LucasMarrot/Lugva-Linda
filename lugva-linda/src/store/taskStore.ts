import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Task, TaskStats, TaskFilters } from '@/types';

interface TaskState {
  tasks: Task[];
  stats: TaskStats | null;
  filters: TaskFilters;
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TaskFilters>) => void;
}

const defaultFilters: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  tag: '',
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  stats: null,
  filters: defaultFilters,
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await api.getTasks();
      set({ tasks, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await api.getStats();
      set({ stats });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  },

  createTask: async (data) => {
    const task = await api.createTask(data);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    get().fetchStats();
  },

  updateTask: async (id, data) => {
    const updated = await api.updateTask(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    get().fetchStats();
  },

  deleteTask: async (id) => {
    await api.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    get().fetchStats();
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },
}));

export function useFilteredTasks() {
  return useTaskStore((state) => {
    const { tasks, filters } = state;
    return tasks.filter((task) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description.toLowerCase().includes(q) &&
          !task.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.tag && !task.tags.includes(filters.tag)) return false;
      return true;
    });
  });
}
