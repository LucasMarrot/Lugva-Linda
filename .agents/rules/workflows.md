---
name: workflows
description: >
  Protocoles de développement autonome pour les features et les bugfixes sur Lugva Linda.
  Chaque agent doit suivre ces workflows séquentiellement sans sauter d'étape.
---

# Workflows de Développement — Lugva Linda

## Feature Workflow

### Contexte
Utilisé pour implémenter une nouvelle fonctionnalité (epics dans [`docs/epics.md`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda/docs/epics.md)).

---

### Étape 1 — Audit de réutilisation (BLOQUANT)

Avant tout code, répondre à chaque question :

```
[ ] Quels composants Shadcn (components/ui/) peuvent être réutilisés ?
[ ] Quels composants shared (components/shared/) peuvent être réutilisés ?
[ ] Quels hooks (hooks/) peuvent être réutilisés ou étendus ?
[ ] Quels schémas Zod (lib/validation/schemas.ts) existent déjà ?
[ ] Quel service (lib/services/) couvre déjà la logique métier ?
[ ] Quels utilitaires (lib/utils.ts, lib/words/) sont applicables ?
```

**Si un nouveau composant générique est nécessaire → l'ajouter à `components/shared/` ou `components/ui/`, pas inline.**

---

### Étape 2 — Implémentation

Ordre de création des fichiers :
1. **Schéma Zod** — ajouter/étendre dans `lib/validation/schemas.ts`
2. **Service métier** — ajouter méthode dans `lib/services/` ou créer un nouveau service
3. **Server Action** — créer dans `actions/` selon le pattern obligatoire (voir `code-quality.md`)
4. **Composants** — créer dans `components/{feature}/` en réutilisant les primitives
5. **Page/Route** — assembler dans `app/(main)/{feature}/page.tsx`

Contraintes :
- TypeScript strict, zéro `any`
- Mobile-first, tous les états (loading, error, empty, data) gérés
- `cn()` pour toutes les classes conditionnelles
- Path aliases `@/*` uniquement

---

### Étape 3 — Vérification qualité

Exécuter le skill `verify-quality` :

```bash
# Type-check complet
npx tsc --noEmit

# Lint
npm run lint

# Format (vérification)
npx prettier --check .

# Tests impactés
npm run test:unit
```

**Si l'une de ces commandes échoue → corriger avant de passer à l'étape suivante.**

---

### Étape 4 — Tests (si logique pure ou logique d'état complexe)

Créer les tests dans `__tests__/` selon la convention `testing.md` :
- Tests des nouvelles fonctions `lib/` créées ou modifiées
- Tests des nouveaux hooks si logique d'état significative
- Tests des composants si interactions utilisateur complexes

---

### Étape 5 — Commit

Format : `feat(scope): description courte`

```bash
git status               # Vérifier qu'aucun fichier parasite n'est stagé
git diff --staged        # Review finale du diff
git add -p               # Staging interactif (préféré au git add .)
git commit -m "feat(encyclopedia): ajouter le filtre par tag obligatoire"
```

**⛔ Ne pas committer :**
- Fichiers `.env`, `.env.local`
- Fichiers de build (`.next/`)
- Fichiers OS (`.DS_Store`)
- `package-lock.json` si seul fichier modifié sans changement de deps

---

## Bugfix Workflow

### Étape 1 — Reproduction et diagnostic

```
[ ] Reproduire le bug de manière isolée
[ ] Identifier la couche affectée : service / action / composant / hook / validation
[ ] Vérifier si un test existant aurait dû attraper ce bug
```

---

### Étape 2 — Test de non-régression (OBLIGATOIRE)

**Écrire d'abord le test qui échoue**, puis corriger le code :

```typescript
// Test qui échoue AVANT le fix (Red)
it('normalizeText should handle null bytes', () => {
  expect(normalizeText('word\x00')).toBe('word');
});

// Fix du code source → test passe (Green)
```

Ce pattern garantit que le bug ne reviendra pas.

---

### Étape 3 — Fix

Corriger le code source de la couche identifiée.
Respecter les contraintes TypeScript et les patterns existants.

---

### Étape 4 — Vérification

```bash
npx tsc --noEmit   # Pas de régression de typage
npm test           # Tous les tests passent
npm run lint       # Lint OK
```

---

### Étape 5 — Commit

Format : `fix(scope): description du bug corrigé`

```bash
git add -p
git commit -m "fix(review): corriger le doublement des logs FSRS pour les cartes AGAIN"
```

---

## Règles universelles

1. **Jamais de WIP commit** sur `main` — utiliser des branches `feat/*` ou `fix/*`
2. **Un commit = une unité logique** — pas de mélanges feature + refactoring + fix
3. **Le CI doit passer** avant tout merge : typecheck + lint + tests
4. **Toute régression de type détectée par `tsc --noEmit`** est un bloquant absolu
5. **Pas de `// @ts-ignore` ou `@ts-expect-error`** sans commentaire expliquant pourquoi
