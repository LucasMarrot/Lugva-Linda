import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../db.js';
import type { Task, DbTask } from '../types.js';

const router = Router();

const TaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).default(''),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).default([]),
  due_date: z.string().nullable().optional(),
});

function dbTaskToTask(row: DbTask): Task {
  return {
    ...row,
    tags: JSON.parse(row.tags),
  };
}

// GET /api/tasks
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as DbTask[];
  res.json(rows.map(dbTaskToTask));
});

// GET /api/tasks/stats/summary
router.get('/stats/summary', (_req: Request, res: Response) => {
  const total = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
  const todo = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'").get() as { count: number }).count;
  const inProgress = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get() as { count: number }).count;
  const done = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get() as { count: number }).count;
  const overdue = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date < ? AND status != 'done'").get(new Date().toISOString().split('T')[0]) as { count: number }).count;
  const highPriority = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'high' AND status != 'done'").get() as { count: number }).count;
  res.json({ total, todo, inProgress, done, overdue, highPriority, completionRate: total > 0 ? Math.round((done / total) * 100) : 0 });
});

// GET /api/tasks/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as DbTask | undefined;
  if (!row) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(dbTaskToTask(row));
});

// POST /api/tasks
router.post('/', (req: Request, res: Response) => {
  const parsed = TaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
    return;
  }
  const { title, description, status, priority, tags, due_date } = parsed.data;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO tasks (id, title, description, status, priority, tags, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, description, status, priority, JSON.stringify(tags), due_date ?? null, now, now);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as DbTask;
  res.status(201).json(dbTaskToTask(row));
});

// PATCH /api/tasks/:id
router.patch('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as DbTask | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  const UpdateSchema = TaskSchema.partial();
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const now = new Date().toISOString();
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k === 'tags' ? 'tags' : k} = ?`);
  const values = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => (k === 'tags' ? JSON.stringify(v) : v));
  if (fields.length === 0) {
    res.json(dbTaskToTask(existing));
    return;
  }
  db.prepare(`UPDATE tasks SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`).run(...values, now, req.params.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as DbTask;
  res.json(dbTaskToTask(updated));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as DbTask | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
