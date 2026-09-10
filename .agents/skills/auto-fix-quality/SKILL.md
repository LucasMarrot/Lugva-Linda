---
name: auto-fix-quality
description: >
  Corrige automatiquement les problèmes de formatage Prettier et tente de résoudre les
  erreurs ESLint courantes dans Lugva Linda. Puis vérifie TypeScript. Utilise ce skill
  quand l'utilisateur dit "corrige le lint", "formate le code", "nettoie les erreurs",
  ou avant un commit si verify-quality a échoué.
---

# Skill : Auto-Fix Quality — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Procédure

### Étape 1 — Formatter (Prettier)

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npm run format
```

Formate automatiquement tous les fichiers. Sans risque — Prettier ne modifie pas la logique.

### Étape 2 — ESLint auto-fix

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx eslint --fix .
```

Corrige automatiquement les règles auto-fixables.

### Étape 3 — Vérifier ce qui reste

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npm run lint
```

Analyser les erreurs restantes et les corriger manuellement selon les patterns ci-dessous.

### Étape 4 — TypeScript

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx tsc --noEmit
```

### Étape 5 — Rapport

Produire un résumé :
```
✅ Prettier — OK (X fichiers formatés)
✅ ESLint — OK (0 erreurs)
✅ TypeScript — OK (0 erreurs)

→ Code prêt pour commit.
```

---

## Patterns de fix manuels ESLint

### `react-hooks/set-state-in-effect` — setState synchrone dans useEffect

❌ Problème :
```typescript
useEffect(() => {
  if (!isReady) {
    setError('not ready'); // ← setState synchrone = render cascade
    return;
  }
}, [isReady]);
```

✅ Fix — Lazy initializer dans useState :
```typescript
const [error, setError] = useState<string | null>(() => {
  if (!isReady) return 'not ready';
  return null;
});

useEffect(() => {
  if (!isReady) return; // plus de setState synchrone
  // ...effets asynchrones uniquement
}, [isReady]);
```

### `@typescript-eslint/no-require-imports` — require() interdit

❌ Problème :
```javascript
const { something } = require('module');
```

✅ Fix — ESM natif ou globalThis :
```javascript
// Pour les modules Node natifs comme crypto
const { subtle } = globalThis.crypto; // Node >= 19

// Pour les modules npm
import { something } from 'module';
```

### `@typescript-eslint/no-explicit-any` — any interdit

❌ Problème :
```typescript
function handler(e: any) {}
const data: any = response;
```

✅ Fix :
```typescript
function handler(e: React.FormEvent<HTMLFormElement>) {}
const data: unknown = response;
// Puis narrow avec typeof, instanceof, ou type guard
```

### `react/no-unescaped-entities`

❌ Problème :
```tsx
<p>L'utilisateur</p>
```

✅ Fix :
```tsx
<p>{"L'utilisateur"}</p>
// ou
<p>L&apos;utilisateur</p>
```

### `@typescript-eslint/no-unused-vars`

Supprimer la variable, ou préfixer avec `_` si intentionnellement ignorée :
```typescript
const [_ignored, setValue] = useState(false);
```
