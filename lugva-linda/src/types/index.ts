export type Status = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  highPriority: number;
  completionRate: number;
}

export interface TaskFilters {
  search: string;
  status: Status | 'all';
  priority: Priority | 'all';
  tag: string;
}
