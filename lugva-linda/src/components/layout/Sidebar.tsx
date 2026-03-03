import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Kanban, Sparkles, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useTaskStore } from '@/store/taskStore';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/tasks', icon: CheckSquare, label: 'Mes tâches' },
  { to: '/board', icon: Kanban, label: 'Kanban' },
];

export function Sidebar() {
  const stats = useTaskStore((s) => s.stats);
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <aside className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 leading-none">Lugva Linda</h1>
          <p className="text-xs text-slate-500 mt-0.5">Task Manager</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {stats && (
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Progression</span>
              <span className="text-primary-400 font-medium">{stats.completionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{stats.done} terminées</span>
              <span>{stats.total} total</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-400 hover:text-slate-100"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800">
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-60 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
        {content}
      </div>
    </>
  );
}
