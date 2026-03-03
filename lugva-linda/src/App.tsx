import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Tasks } from '@/pages/Tasks';
import { Board } from '@/pages/Board';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/board" element={<Board />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
