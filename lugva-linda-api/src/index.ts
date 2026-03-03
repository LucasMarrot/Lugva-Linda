import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import tasksRouter from './routes/tasks.js';

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`🚀 Lugva Linda API running on http://localhost:${PORT}`);
});

export default app;
