import { create } from 'zustand';
import type { Task, TaskFormData, TaskStats, Status, Priority } from '../types';
import { loadTasks, saveTasks } from '../utils/localStorage';

interface TaskStore {
  tasks: Task[];
  filterStatus: Status | 'all';
  filterPriority: Priority | 'all';
  searchQuery: string;

  addTask: (data: TaskFormData) => void;
  updateTask: (id: string, data: Partial<TaskFormData>) => void;
  deleteTask: (id: string) => void;
  setFilterStatus: (status: Status | 'all') => void;
  setFilterPriority: (priority: Priority | 'all') => void;
  setSearchQuery: (query: string) => void;
  getFilteredTasks: () => Task[];
  getStats: () => TaskStats;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: loadTasks(),
  filterStatus: 'all',
  filterPriority: 'all',
  searchQuery: '',

  addTask: (data) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const tasks = [...state.tasks, task];
      saveTasks(tasks);
      return { tasks };
    });
  },

  updateTask: (id, data) => {
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      );
      saveTasks(tasks);
      return { tasks };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      saveTasks(tasks);
      return { tasks };
    });
  },

  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getFilteredTasks: () => {
    const { tasks, filterStatus, filterPriority, searchQuery } = get();
    return tasks.filter((t) => {
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesPriority =
        filterPriority === 'all' || t.priority === filterPriority;
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  },

  getStats: (): TaskStats => {
    const { tasks } = get();
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  },
}));
