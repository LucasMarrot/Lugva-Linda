import { useState } from 'react';
import { Calendar, Tag, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from './TaskForm';
import { useTaskStore } from '@/store/taskStore';
import type { Task, Priority, Status } from '@/types';

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};
const STATUS_LABELS: Record<Status, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isOverdue =
    task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'done';

  return (
    <>
      <div
        className={clsx(
          'group bg-slate-800/60 border rounded-2xl p-4 transition-all duration-200 hover:bg-slate-800 hover:border-slate-600',
          isOverdue ? 'border-red-500/40' : 'border-slate-700/50'
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
            }
            className={clsx(
              'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all duration-200',
              task.status === 'done'
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-500 hover:border-emerald-500'
            )}
          >
            {task.status === 'done' && (
              <svg
                className="w-full h-full text-white p-0.5"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={clsx(
                  'font-medium text-sm leading-snug',
                  task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'
                )}
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1.5 hover:text-red-400"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={task.priority}>{PRIORITY_LABELS[task.priority]}</Badge>
              <Badge variant={task.status}>{STATUS_LABELS[task.status]}</Badge>
            </div>

            {(task.description || task.tags.length > 0 || task.due_date) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {expanded ? 'Moins' : 'Plus'}
              </button>
            )}

            {expanded && (
              <div className="mt-3 flex flex-col gap-2">
                {task.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>
                )}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {task.tags.map((tag) => (
                      <Badge key={tag} className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {task.due_date && (
                  <div
                    className={clsx(
                      'flex items-center gap-1 text-xs',
                      isOverdue ? 'text-red-400' : 'text-slate-400'
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(task.due_date), 'd MMM yyyy', { locale: fr })}
                    {isOverdue && ' · En retard'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Modifier la tâche">
        <TaskForm
          initialData={task}
          onSubmit={async (data) => {
            await updateTask(task.id, data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <Modal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title="Supprimer la tâche"
      >
        <p className="text-slate-300 mb-5">
          Êtes-vous sûr de vouloir supprimer{' '}
          <strong className="text-slate-100">"{task.title}"</strong> ? Cette action est
          irréversible.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await deleteTask(task.id);
              setConfirming(false);
            }}
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </>
  );
}
