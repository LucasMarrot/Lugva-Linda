import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Task, Status } from '@/types';

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo', label: 'À faire', color: 'text-slate-400' },
  { id: 'in_progress', label: 'En cours', color: 'text-blue-400' },
  { id: 'done', label: 'Terminé', color: 'text-emerald-400' },
];

export function Board() {
  const { tasks, fetchTasks, fetchStats, createTask } = useTaskStore();
  const [creating, setCreating] = useState<Status | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const handleCreate = async (data: Partial<Task>) => {
    if (!creating) return;
    await createTask({ ...data, status: creating });
    setCreating(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Kanban</h1>
        <p className="text-slate-400 mt-1">Vue par statut</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className={`font-semibold text-sm ${col.color}`}>{col.label}</h2>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5"
                  onClick={() => setCreating(col.id)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              {colTasks.length === 0 && (
                <button
                  onClick={() => setCreating(col.id)}
                  className="py-8 text-center text-sm text-slate-600 hover:text-slate-500 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl transition-colors"
                >
                  + Ajouter une tâche
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!creating}
        onClose={() => setCreating(null)}
        title={`Nouvelle tâche — ${COLUMNS.find((c) => c.id === creating)?.label ?? ''}`}
      >
        <TaskForm
          initialData={{ status: creating ?? 'todo' }}
          onSubmit={handleCreate}
          onCancel={() => setCreating(null)}
        />
      </Modal>
    </div>
  );
}
