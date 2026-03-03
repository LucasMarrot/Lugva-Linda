import { Layout } from '../components/layout/Layout';
import { TaskList } from '../components/tasks/TaskList';

export function Tasks() {
  return (
    <Layout title="Tasks">
      <TaskList />
    </Layout>
  );
}
