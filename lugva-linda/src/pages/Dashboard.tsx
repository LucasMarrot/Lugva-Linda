import { useEffect } from 'react';
import { CheckSquare, Clock, AlertCircle, Flame, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useTaskStore } from '@/store/taskStore';
import { Button } from '@/components/ui/Button';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={clsx('w-6 h-6', color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { stats, tasks, fetchTasks, fetchStats } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tableau de bord</h1>
          <p className="text-slate-400 mt-1">Bienvenue sur Lugva Linda ✨</p>
        </div>
        <Link to="/tasks">
          <Button>
            <Plus className="w-4 h-4" />
            Nouvelle tâche
          </Button>
        </Link>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total des tâches"
              value={stats.total}
              icon={CheckSquare}
              color="text-primary-400"
              bg="bg-primary-600/20"
            />
            <StatCard
              label="En cours"
              value={stats.inProgress}
              icon={Clock}
              color="text-blue-400"
              bg="bg-blue-600/20"
            />
            <StatCard
              label="En retard"
              value={stats.overdue}
              icon={AlertCircle}
              color="text-red-400"
              bg="bg-red-600/20"
            />
            <StatCard
              label="Haute priorité"
              value={stats.highPriority}
              icon={Flame}
              color="text-amber-400"
              bg="bg-amber-600/20"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-slate-100">Taux de complétion</h2>
              <span className="ml-auto text-2xl font-bold text-primary-400">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-700 via-primary-500 to-primary-400 rounded-full transition-all duration-700"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm text-slate-400">
              <span>{stats.todo} à faire</span>
              <span>{stats.inProgress} en cours</span>
              <span>{stats.done} terminées</span>
            </div>
          </div>
        </>
      )}

      {recentTasks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-100 mb-4">Tâches récentes</h2>
          <div className="flex flex-col gap-2">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0"
              >
                <div
                  className={clsx('w-2 h-2 rounded-full flex-shrink-0', {
                    'bg-slate-500': task.status === 'todo',
                    'bg-blue-500': task.status === 'in_progress',
                    'bg-emerald-500': task.status === 'done',
                  })}
                />
                <span
                  className={clsx(
                    'text-sm flex-1',
                    task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-300'
                  )}
                >
                  {task.title}
                </span>
                <span
                  className={clsx('text-xs px-2 py-0.5 rounded-md', {
                    'bg-red-500/20 text-red-400': task.priority === 'high',
                    'bg-amber-500/20 text-amber-400': task.priority === 'medium',
                    'bg-emerald-500/20 text-emerald-400': task.priority === 'low',
                  })}
                >
                  {task.priority === 'high'
                    ? 'Haute'
                    : task.priority === 'medium'
                      ? 'Moyenne'
                      : 'Basse'}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/tasks"
            className="block mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            Voir toutes les tâches →
          </Link>
        </div>
      )}

      {!stats && (
        <div className="text-center py-20 text-slate-500">
          <p>Chargement...</p>
        </div>
      )}
    </div>
  );
}
