# Lugva Linda — Workspace Antigravity

Application web mobile-first (PWA) d'apprentissage du vocabulaire par répétition espacée (FSRS).
Privée, multi-utilisateurs sur invitation, déployée sur Vercel.

## Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 16+ (App Router) |
| UI | React 19 + Shadcn UI (new-york) + Tailwind CSS v4 |
| Auth | Supabase Auth |
| DB | PostgreSQL + Prisma 7 + adapter pg |
| Révision | FSRS via `ts-fsrs` |
| Déploiement | Vercel |
| Tests | Vitest 5 + React Testing Library + jsdom |

## Structure du projet

```
lugva-linda/               ← racine de l'application (cd ici pour toutes les commandes)
├── app/                   ← Routes App Router (App Router Next.js)
│   ├── (main)/            ← Routes authentifiées
│   │   ├── page.tsx       ← Dashboard
│   │   ├── words/         ← Encyclopédie personnelle
│   │   ├── review/        ← Sessions de révision FSRS
│   │   ├── search/        ← Recherche communautaire
│   │   ├── duel/          ← Mode battle (pas de FSRS)
│   │   ├── stats/         ← Statistiques de progression
│   │   ├── settings/      ← Paramètres utilisateur
│   │   └── community/     ← Encyclopédies des autres membres
│   ├── auth/              ← Login, signup
│   ├── contribute/        ← Mode contributeur
│   └── api/cron/          ← Cron jobs (push notifications)
├── actions/               ← Server Actions (6 fichiers)
├── components/
│   ├── ui/                ← 15 composants Shadcn (barrel: index.ts)
│   ├── shared/            ← 14+ composants réutilisables (barrel: index.ts)
│   ├── layout/            ← Header, BottomNav, AppSplashScreen
│   ├── providers/         ← 8 React Providers (barrel: index.ts)
│   ├── dashboard/         ← Composants dashboard
│   ├── encyclopedia/      ← Composants encyclopédie
│   ├── review/            ← Composants session de révision
│   ├── duel/              ← Composants mode battle
│   ├── search/            ← Composants recherche
│   ├── settings/          ← Composants paramètres
│   └── pwa/               ← Service Worker, Splash Screen
├── hooks/                 ← 8 hooks React custom
├── lib/
│   ├── auth/              ← requireAuth() server-side
│   ├── services/          ← Logique métier (word-service 42KB, review-service, etc.)
│   ├── validation/        ← Schémas Zod centralisés (schemas.ts)
│   ├── words/             ← Normalisation, notes, tags, community
│   ├── users/             ← Couleurs utilisateur
│   ├── supabase/          ← Clients Supabase (server/client)
│   ├── errors.ts          ← Hiérarchie d'erreurs typées
│   ├── fsrs.ts            ← Wrapper FSRS
│   └── utils.ts           ← cn(), frenchPluralize(), formatConcept(), etc.
├── prisma/
│   └── schema.prisma      ← 8 modèles, 4 enums
├── __tests__/             ← Tests Vitest (mirror de la structure src)
├── types/                 ← Déclarations de types globaux
├── data/                  ← Accès données côté serveur (RSC)
└── docs/                  ← Epics produit, overview projet
```

## Règles de développement

Les règles sont chargées automatiquement depuis `.agents/rules/`. En résumé :

1. **Architecture** → [`rules/architecture.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/rules/architecture.md)
   Inventaire complet des composants, hooks, providers et utilitaires réutilisables.
   **Auditer avant chaque implémentation.**

2. **Qualité** → [`rules/code-quality.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/rules/code-quality.md)
   TypeScript strict, 4 états obligatoires (loading/error/empty/data), mobile-first, patterns Server Actions, Conventional Commits.

3. **Tests** → [`rules/testing.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/rules/testing.md)
   Convention `__tests__/` mirroring, priorités de test, mocking patterns.

4. **Workflows** → [`rules/workflows.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/rules/workflows.md)
   Feature workflow (5 étapes) et bugfix workflow (5 étapes).

## Skills disponibles

### Qualité & Vérification

- **`verify-quality`** → [`skills/verify-quality/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/verify-quality/SKILL.md)
  TypeScript + ESLint + Prettier + Vitest en séquence. **À exécuter avant tout commit.**

- **`run-impacted-tests`** → [`skills/run-impacted-tests/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/run-impacted-tests/SKILL.md)
  Vitest `--changed` pour feedback rapide sur les fichiers modifiés.

- **`auto-fix-quality`** → [`skills/auto-fix-quality/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/auto-fix-quality/SKILL.md)
  Corrige automatiquement Prettier + ESLint. Patterns de fix pour les erreurs manuelles.

### Git & Workflow

- **`smart-commit`** → [`skills/smart-commit/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/smart-commit/SKILL.md)
  Analyse le diff Git, détecte le scope et le type, génère un message Conventional Commits orienté produit. **Invoquer pour tout commit.**

### Création de Features

- **`scaffold-feature`** → [`skills/scaffold-feature/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/scaffold-feature/SKILL.md)
  Workflow complet 8 étapes : audit → Zod → service → action → composants → route → tests → quality.

- **`scaffold-server-action`** → [`skills/scaffold-server-action/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/scaffold-server-action/SKILL.md)
  Template Server Action 6 couches (auth, CSRF, rate-limit, service, logging, error mapping).

- **`bootstrap-tests`** → [`skills/bootstrap-tests/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/bootstrap-tests/SKILL.md)
  Crée un fichier de test Vitest conforme aux conventions. Calcule le chemin miroir `__tests__/`.

### Base de Données

- **`prisma-schema-change`** → [`skills/prisma-schema-change/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/prisma-schema-change/SKILL.md)
  Évolution sécurisée du schéma Prisma : validate → generate → tsc. Encode les règles de modélisation (soft-delete, contraintes d'unicité, relations).

### Domaine Métier

- **`community-data-flow`** → [`skills/community-data-flow/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/community-data-flow/SKILL.md)
  Règles de collaboration encyclopédique : ownership, import = copie, langues globales vs mots privés.

- **`add-fsrs-exercise`** → [`skills/add-fsrs-exercise/SKILL.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/.agents/skills/add-fsrs-exercise/SKILL.md)
  Ajouter un nouveau type d'exercice FSRS (FSRS solo uniquement, jamais en Battle, progression indépendante par type).

## Commandes essentielles

```bash
# Depuis lugva-linda/
npm run dev          # Serveur de développement
npm test             # Tests Vitest (CI)
npm run test:watch   # Tests en mode watch
npm run lint         # ESLint
npm run format       # Prettier
npx tsc --noEmit     # TypeScript check

# Prisma
npx prisma generate  # Regénérer le client (après modif schema)
npx prisma validate  # Valider le schema
npx prisma studio    # UI d'exploration DB
```

## Règles métier clés

- **FSRS uniquement en révision solo** — les battles/duels n'impactent PAS la planification
- Les mots appartiennent à un propriétaire (`ownerId`) mais sont lisibles par tous dans la même langue
- L'import communautaire crée une **copie** du mot (tracking via `sourceWordId`)
- La langue active est persistée par utilisateur en base (`User.activeLanguageId`)
- Soft delete sur les mots (`isDeleted`, `deletedAt`, `purgeAfter`)
- Contrainte métier : un mot est unique par `(ownerId, languageId, term, mandatoryTag)`

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) :
1. Prisma validate
2. Prisma generate
3. `tsc --noEmit`
4. ESLint
5. Vitest

Branches déclenchantes : `main`, `feat/**`
