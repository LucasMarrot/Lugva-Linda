# Lugva Linda — Frontend

Application de gestion de tâches moderne construite avec React, TypeScript et Vite.

## Fonctionnalités

- **Tableau de bord** — Statistiques, taux de complétion, tâches récentes
- **Liste de tâches** — CRUD complet avec recherche, filtres par statut/priorité/tag
- **Vue Kanban** — Colonnes À faire / En cours / Terminé
- **Responsive** — Mobile-first avec menu hamburger sur mobile

## Stack technique

| Couche | Technologie |
|--------|-------------|
| UI | React 19 + TypeScript |
| Styles | Tailwind CSS v4 |
| State | Zustand |
| Routing | React Router v7 |
| Icons | Lucide React |
| Build | Vite 7 |

## Démarrage

```bash
npm install
npm run dev
```

L'application sera disponible sur [http://localhost:5173](http://localhost:5173).

> **Note:** Le serveur API doit tourner sur `http://localhost:3001`. Voir `../lugva-linda-api/`.

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Linter ESLint |
| `npm run preview` | Prévisualiser le build |

## Structure du projet

```
src/
├── types/        # Interfaces TypeScript (Task, Status, Priority…)
├── lib/          # Client API fetch
├── store/        # Zustand store avec CRUD, filtres, stats
├── components/
│   ├── ui/       # Button, Input, Select, Badge, Modal, Textarea
│   ├── layout/   # Layout, Sidebar avec navigation responsive
│   └── tasks/    # TaskCard, TaskForm
└── pages/        # Dashboard, Tasks, Board
```

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
