import { useEffect, useState } from 'react';
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useTaskStore, useFilteredTasks } from '@/store/taskStore';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Task } from '@/types';

export function Tasks() {
  const { fetchTasks, fetchStats, createTask, setFilters, filters, loading } = useTaskStore();
  const filteredTasks = useFilteredTasks();
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const handleCreate = async (data: Partial<Task>) => {
    await createTask(data);
    setCreating(false);
  };

  const hasActiveFilters =
    filters.status !== 'all' || filters.priority !== 'all' || filters.tag !== '';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mes tâches</h1>
          <p className="text-slate-400 mt-1">
            {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
          size="md"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full" />}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3">
          <Select
            label="Statut"
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as typeof filters.status })}
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
          </Select>
          <Select
            label="Priorité"
            value={filters.priority}
            onChange={(e) =>
              setFilters({ priority: e.target.value as typeof filters.priority })
            }
          >
            <option value="all">Toutes priorités</option>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </Select>
          <Input
            label="Tag"
            placeholder="Filtrer par tag..."
            value={filters.tag}
            onChange={(e) => setFilters({ tag: e.target.value })}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500">Aucune tâche trouvée</p>
          {!hasActiveFilters && !filters.search && (
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4" />
              Créer ma première tâche
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Nouvelle tâche">
        <TaskForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
