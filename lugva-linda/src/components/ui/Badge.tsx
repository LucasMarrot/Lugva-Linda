import styles from './Badge.module.css';

interface BadgeProps {
  variant: 'priority-low' | 'priority-medium' | 'priority-high' | 'status-todo' | 'status-in-progress' | 'status-done';
  label: string;
}

export function Badge({ variant, label }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{label}</span>;
}
