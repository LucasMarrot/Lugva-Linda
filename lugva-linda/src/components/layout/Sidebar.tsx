import { NavLink } from 'react-router-dom';
import { useTaskStore } from '../../store/taskStore';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/tasks', label: 'Tasks', icon: '📋' },
];

export function Sidebar() {
  const tasks = useTaskStore((s) => s.tasks);
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>✨</span>
        <span className={styles.logoText}>Lugva Linda</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.statsPanel}>
        <p className={styles.statsTitle}>Quick Stats</p>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{todo}</span>
            <span className={styles.statLabel}>To Do</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{inProgress}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{done}</span>
            <span className={styles.statLabel}>Done</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
