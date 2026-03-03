import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { Task, Priority, Status } from '@/types';

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ initialData, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [status, setStatus] = useState<Status>(initialData?.status ?? 'todo');
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? 'medium');
  const [tagsInput, setTagsInput] = useState((initialData?.tags ?? []).join(', '));
  const [dueDate, setDueDate] = useState(initialData?.due_date ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        tags,
        due_date: dueDate || null,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Titre *"
        placeholder="Titre de la tâche"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={error && !title.trim() ? error : undefined}
      />
      <Textarea
        label="Description"
        placeholder="Description optionnelle..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </Select>
        <Select
          label="Priorité"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="low">Basse</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </Select>
      </div>
      <Input
        label="Tags (séparés par des virgules)"
        placeholder="design, dev, urgent..."
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
      />
      <Input
        label="Date d'échéance"
        type="date"
        value={dueDate ?? ''}
        onChange={(e) => setDueDate(e.target.value)}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement...' : initialData?.id ? 'Mettre à jour' : 'Créer la tâche'}
        </Button>
      </div>
    </form>
  );
}
