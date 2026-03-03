import { useState } from 'react';
import type { Task } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TaskForm } from './TaskForm';
import { useTaskStore } from '../../store/taskStore';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOverdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  return (
    <>
      <article className={`${styles.card} ${isOverdue ? styles.overdue : ''}`}>
        <div className={styles.header}>
          <div className={styles.badges}>
            <Badge
              variant={`priority-${task.priority}`}
              label={task.priority}
            />
            <Badge
              variant={`status-${task.status}`}
              label={task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
            />
          </div>
          <div className={styles.actions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              aria-label="Edit task"
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete task"
            >
              🗑️
            </Button>
          </div>
        </div>

        <h3 className={styles.title}>{task.title}</h3>

        {task.description && (
          <p className={styles.description}>{task.description}</p>
        )}

        {task.tags.length > 0 && (
          <div className={styles.tags}>
            {task.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          {task.dueDate && (
            <span className={`${styles.due} ${isOverdue ? styles.dueOverdue : ''}`}>
              📅 {formatDate(task.dueDate)}
            </span>
          )}
          <span className={styles.created}>
            Created {formatDate(task.createdAt)}
          </span>
        </div>
      </article>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Task"
      >
        <TaskForm
          initial={task}
          onSubmit={(data) => {
            updateTask(task.id, data);
            setIsEditOpen(false);
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Task"
      >
        <p className={styles.confirmText}>
          Are you sure you want to delete <strong>"{task.title}"</strong>? This
          action cannot be undone.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteTask(task.id);
              setConfirmDelete(false);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
