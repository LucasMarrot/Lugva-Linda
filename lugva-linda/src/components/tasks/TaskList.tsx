import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import styles from './TaskList.module.css';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'todo', label: '📋 To Do' },
  { value: 'in-progress', label: '🔄 In Progress' },
  { value: 'done', label: '✅ Done' },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

export function TaskList() {
  const store = useTaskStore();
  const { filterStatus, filterPriority, searchQuery } = store;
  const addTask = store.addTask;
  const setFilterStatus = store.setFilterStatus;
  const setFilterPriority = store.setFilterPriority;
  const setSearchQuery = store.setSearchQuery;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const filteredTasks = store.getFilteredTasks();

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Input
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.search}
          />
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as typeof filterStatus)
            }
          />
          <Select
            options={PRIORITY_FILTER_OPTIONS}
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as typeof filterPriority)
            }
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>+ New Task</Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>📋</p>
          <p className={styles.emptyText}>No tasks found</p>
          <p className={styles.emptyHint}>
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first task to get started!'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
            <Button onClick={() => setIsCreateOpen(true)}>+ Create Task</Button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Task"
      >
        <TaskForm
          onSubmit={(data) => {
            addTask(data);
            setIsCreateOpen(false);
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
