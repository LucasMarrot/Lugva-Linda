---
name: smart-commit
description: >
  Analyse le diff Git stagé et génère automatiquement un commit Conventional Commits
  avec un message orienté produit (pas juste technique). Détecte le scope applicatif
  (encyclopedia, review, duel, auth, etc.) et le type (feat/fix/refactor/chore/test)
  depuis les fichiers modifiés. Utilise ce skill quand l'utilisateur dit "commit mes
  changements", "fais un commit", ou demande de versionner le travail en cours.
---

# Skill : Smart Commit — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Procédure complète

### Étape 1 — Vérifier l'état Git

```bash
git -C /Users/lucas/Desktop/Projets/Lugva-Linda status
git -C /Users/lucas/Desktop/Projets/Lugva-Linda diff --staged --stat
```

Si **rien n'est stagé** : demander à l'utilisateur ce qu'il veut committer.
Ne jamais faire `git add .` sans confirmation — signaler les fichiers non-stagés à l'utilisateur.

Si **des fichiers non-trackés** sont présents : les signaler avant de continuer.

### Étape 2 — Gate qualité (rapide)

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx tsc --noEmit && npm run lint
```

- Si **tsc échoue** → STOP. Corriger avant de committer.
- Si **ESLint échoue** → STOP. Corriger avant de committer.
- Si les deux passent → continuer.

### Étape 3 — Analyser le diff

```bash
git -C /Users/lucas/Desktop/Projets/Lugva-Linda diff --staged
```

Lire le diff pour comprendre **ce qui change fonctionnellement**, pas juste quels fichiers.

### Étape 4 — Détecter le scope

Mapper les fichiers modifiés vers le scope applicatif :

| Fichiers modifiés | Scope |
|---|---|
| `components/encyclopedia/`, `app/(main)/words/`, `lib/words/`, `actions/word-actions.ts` | `encyclopedia` |
| `components/review/`, `app/(main)/review/`, `lib/fsrs.ts`, `lib/services/review-service.ts`, `actions/review-actions.ts` | `review` |
| `components/duel/`, `app/(main)/duel/`, `hooks/useDuelGame.ts`, `actions/duel-actions.ts` | `duel` |
| `components/dashboard/`, `app/(main)/page.tsx`, `data/dashboard.ts` | `dashboard` |
| `components/search/`, `app/(main)/search/` | `search` |
| `components/settings/`, `app/(main)/settings/`, `actions/user-actions.ts` | `settings` |
| `components/shared/`, `components/ui/` | `shared` |
| `app/(main)/community/`, `lib/words/community.ts` | `community` |
| `lib/services/`, `lib/validation/`, `lib/errors.ts`, `actions/language-actions.ts` | `lib` |
| `prisma/schema.prisma` | `schema` |
| `app/auth/`, `lib/auth/`, `lib/supabase/` | `auth` |
| `app/api/cron/`, `lib/push/`, `actions/push-actions.ts` | `api` |
| `app/contribute/`, `components/contributor/` | `contribute` |
| `.github/`, `.agents/` | `ci` |
| `components/pwa/`, `public/`, `lib/push/` | `pwa` |

Si plusieurs scopes → prendre le scope le plus représenté en lignes modifiées.

### Étape 5 — Détecter le type

| Signal dans le diff | Type |
|---|---|
| Nouveaux fichiers avec fonctionnalité utilisateur | `feat` |
| Correction d'un comportement incorrect | `fix` |
| Restructuration sans changement de comportement | `refactor` |
| Uniquement `__tests__/` | `test` |
| Config, deps, CI, `.agents/`, outils | `chore` |
| Uniquement documentation | `docs` |
| Formatage, espaces, imports réordonnés | `style` |
| Optimisation de performance sans nouveau comportement | `perf` |

### Étape 6 — Générer le message

**Format obligatoire** : `type(scope): description en minuscule, en français`

Le message décrit l'**impact produit**, pas les détails techniques :

❌ Mauvais :
```
feat(lib): add function importCommunityWordWithSelectionForUser in word-service.ts
fix(components): update useState initialization in usePushNotifications.ts
```

✅ Bon :
```
feat(community): permettre l'import sélectif de champs depuis le vocabulaire d'un membre
fix(pwa): corriger l'initialisation de la permission push sur iOS PWA
```

Règles : max 72 caractères, pas de point final, infinitif ou nominale, en français.

### Étape 7 — Proposer et confirmer

Afficher :
```
📝 Commit proposé :

  fix(pwa): corriger l'initialisation de la permission push sur iOS PWA

Fichiers inclus (3) :
  M components/pwa/usePushNotifications.ts
  M scripts/generate-vapid-keys.js
  M lib/push/push-client.ts

✅ Valider ? (oui / modifier / annuler)
```

### Étape 8 — Exécuter

Si l'utilisateur valide :
```bash
git -C /Users/lucas/Desktop/Projets/Lugva-Linda commit -m "fix(pwa): corriger l'initialisation de la permission push sur iOS PWA"
```

## Anti-patterns

- ⛔ Ne jamais committer `.env`, `.env.local`, `.next/`, `node_modules/`
- ⛔ Ne jamais mélanger feature + refactoring + fix dans un commit
- ⛔ Ne jamais committer si tsc ou ESLint échouent
- ⛔ Pas de message vague : `fix: fix bug`, `update files`, `wip`
