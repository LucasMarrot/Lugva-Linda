import { useTaskStore } from '../store/taskStore';
import { Layout } from '../components/layout/Layout';
import styles from './Dashboard.module.css';

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  accent: string;
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className={styles.statCard} style={{ '--accent': accent } as React.CSSProperties}>
      <div className={styles.statIconWrapper}>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statBody}>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const tasks = useTaskStore((s) => s.tasks);
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  const completionRate =
    total > 0 ? Math.round((done / total) * 100) : 0;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date()
  );

  return (
    <Layout title="Dashboard">
      <div className={styles.container}>
        <section className={styles.statsRow}>
          <StatCard icon="📋" label="Total Tasks" value={total} accent="#6366f1" />
          <StatCard icon="🔲" label="To Do" value={todo} accent="#818cf8" />
          <StatCard icon="🔄" label="In Progress" value={inProgress} accent="#f59e0b" />
          <StatCard icon="✅" label="Done" value={done} accent="#10b981" />
        </section>

        <div className={styles.panels}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Completion Rate</h2>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className={styles.progressLabel}>{completionRate}%</span>
            </div>
            {total === 0 && (
              <p className={styles.emptyHint}>Create your first task to get started!</p>
            )}
          </section>

          {overdueTasks.length > 0 && (
            <section className={`${styles.panel} ${styles.overduePanel}`}>
              <h2 className={styles.panelTitle}>⚠️ Overdue Tasks ({overdueTasks.length})</h2>
              <ul className={styles.taskList}>
                {overdueTasks.map((t) => (
                  <li key={t.id} className={styles.taskItem}>
                    <span className={styles.taskTitle}>{t.title}</span>
                    <span className={styles.taskDue}>
                      Due {new Date(t.dueDate!).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent Activity</h2>
            {recentTasks.length === 0 ? (
              <p className={styles.emptyHint}>No tasks yet.</p>
            ) : (
              <ul className={styles.taskList}>
                {recentTasks.map((t) => (
                  <li key={t.id} className={styles.taskItem}>
                    <span className={styles.taskTitle}>{t.title}</span>
                    <span className={`${styles.statusDot} ${styles[`dot-${t.status}`]}`} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
