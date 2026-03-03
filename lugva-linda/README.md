# Lugva Linda ✨

A beautiful, modern task management application built with React, TypeScript, and Vite.

## Features

- **Dashboard** — Stats overview, completion rate, recent activity, overdue alerts
- **Task Management** — Create, edit, and delete tasks with full CRUD support
- **Filters & Search** — Filter by status (To Do / In Progress / Done) and priority (Low / Medium / High), plus full-text search
- **Tags** — Label tasks with comma-separated tags
- **Due Dates** — Set deadlines with visual overdue indicators
- **Persistence** — All data saved to `localStorage` automatically

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript |
| State | Zustand |
| Routing | React Router DOM v7 |
| Styling | CSS Modules |
| Build | Vite 7 |
| Tests | Vitest + @testing-library/react |

## Getting Started

```bash
cd lugva-linda
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── types/          # TypeScript interfaces (Task, Priority, Status…)
├── utils/          # localStorage persistence helpers
├── store/          # Zustand store with CRUD + filters + search
├── components/
│   ├── ui/         # Button, Input, Select, Badge, Modal
│   ├── layout/     # Layout shell, Sidebar with live stats
│   └── tasks/      # TaskCard, TaskList, TaskForm
└── pages/          # Dashboard, Tasks
```
