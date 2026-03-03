# Lugva Linda — API

Backend REST pour l'application Lugva Linda, construit avec Express et TypeScript.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Express 4 + TypeScript |
| Base de données | SQLite via better-sqlite3 |
| Validation | Zod |
| Rate limiting | express-rate-limit |
| Runner dev | tsx watch |

## Démarrage

```bash
npm install
npm run dev
```

L'API sera disponible sur [http://localhost:3001](http://localhost:3001).

## Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/health` | État du serveur |
| `GET` | `/api/tasks` | Liste toutes les tâches |
| `GET` | `/api/tasks/stats/summary` | Statistiques globales |
| `GET` | `/api/tasks/:id` | Détail d'une tâche |
| `POST` | `/api/tasks` | Créer une tâche |
| `PATCH` | `/api/tasks/:id` | Modifier une tâche |
| `DELETE` | `/api/tasks/:id` | Supprimer une tâche |

## Structure du projet

```
src/
├── db.ts           # Connexion SQLite + schéma
├── types.ts        # Types Task, DbTask, Status, Priority
├── routes/
│   └── tasks.ts    # CRUD tâches + stats
└── index.ts        # Express app, CORS, rate limiting
```

## Base de données

Les données sont stockées dans `data/lugva-linda.db` (SQLite, exclu du git).
