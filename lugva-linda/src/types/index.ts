export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}
