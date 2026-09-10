---
name: testing
description: >
  Conventions et standards de test Vitest + React Testing Library pour Lugva Linda.
  Définit quoi tester, comment, et où placer les fichiers.
---

# Conventions de Test — Lugva Linda

## Stack de test

| Outil | Rôle |
|---|---|
| **Vitest 5** | Runner de tests, assertions, mocking |
| **@testing-library/react** | Rendu et interactions avec les composants React |
| **@testing-library/user-event** | Simulation d'interactions utilisateur réalistes |
| **@testing-library/jest-dom** | Matchers DOM étendus (`toBeInTheDocument`, etc.) |
| **jsdom** | Simulation du DOM navigateur |

Config : [`vitest.config.ts`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda/vitest.config.ts)
Setup : [`vitest.setup.ts`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda/vitest.setup.ts)

---

## Structure des dossiers de tests

```
lugva-linda/
└── __tests__/
    ├── lib/
    │   ├── utils.test.ts
    │   ├── errors.test.ts
    │   ├── fsrs.test.ts
    │   ├── validation/
    │   │   └── schemas.test.ts
    │   ├── words/
    │   │   ├── normalization.test.ts
    │   │   └── community.test.ts
    │   └── services/
    │       ├── word-policies.test.ts
    │       └── community-merge.test.ts
    ├── hooks/
    │   ├── useReviewSession.test.ts
    │   └── useCalendarData.test.ts
    └── components/
        ├── shared/
        │   ├── StateMessage.test.tsx
        │   ├── ConfirmButton.test.tsx
        │   └── WordListItem.test.tsx
        └── encyclopedia/
            └── TagFilter.test.tsx
```

**Règle : le chemin dans `__tests__/` doit mirror le chemin du fichier source.**
- `lib/utils.ts` → `__tests__/lib/utils.test.ts`
- `components/shared/StateMessage.tsx` → `__tests__/components/shared/StateMessage.test.tsx`

---

## Priorités de test

### 1. Logique pure — priorité maximale

Tester en premier tout code sans dépendance à React ou à la DB :

```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn, frenchPluralize, formatConcept } from '@/lib/utils';

describe('cn()', () => {
  it('merge classes correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('p-4', 'p-2')).toBe('p-2'); // tailwind-merge résout les conflits
  });
});
```

**Cibles prioritaires :**
- `lib/utils.ts` — utilitaires purs
- `lib/words/normalization.ts` — normalisation unicode (sensible aux régressions)
- `lib/words/notes.ts` — extraction de texte BlockNote
- `lib/validation/schemas.ts` — schémas Zod (cas valides + cas d'erreur)
- `lib/services/word-policies.ts` — règles métier simples
- `lib/services/community-merge.ts` — logique de fusion communautaire

### 2. Services métier — priorité haute

Les services (`lib/services/`) doivent être testés avec des mocks Prisma :

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock du client Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    word: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

### 3. Hooks React — priorité moyenne

Utiliser `renderHook` de RTL :

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCalendarData } from '@/hooks/useCalendarData';

it('returns empty slots when no data', () => {
  const { result } = renderHook(() => useCalendarData([]));
  expect(result.current.slots).toHaveLength(0);
});
```

### 4. Composants React — priorité basse (post-infrastructure)

Tester les interactions utilisateur, pas le rendu visuel :

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmButton } from '@/components/shared/ConfirmButton';

it('calls onConfirm after second click', async () => {
  const onConfirm = vi.fn();
  render(<ConfirmButton onConfirm={onConfirm}>Supprimer</ConfirmButton>);

  await userEvent.click(screen.getByRole('button'));
  expect(onConfirm).not.toHaveBeenCalled(); // Premier clic = confirmation

  await userEvent.click(screen.getByRole('button'));
  expect(onConfirm).toHaveBeenCalledOnce();
});
```

---

## Règles d'écriture

### Nommage
```typescript
describe('normalizeText()', () => {       // Fonction/composant testé
  it('trims leading and trailing spaces', () => {}); // Comportement attendu
  it('normalizes NFC unicode', () => {});
  it('returns empty string for empty input', () => {});
});
```

- `describe` : nom de la fonction ou du composant
- `it` : phrase décrivant le comportement attendu (sans "should")

### Ce qu'on ne teste PAS
- ❌ Les composants Shadcn UI (`button.tsx`, `input.tsx`, etc.) — primitives externes
- ❌ Les layouts Next.js (`layout.tsx`) — trop couplés à l'infrastructure
- ❌ Les Server Actions directement — trop de dépendances DB/auth (intégration future)
- ❌ Les styles visuels (`className`, couleurs) — fragiles et peu utiles

### Mocking
```typescript
// Server Actions → toujours mocker
vi.mock('@/actions/word-actions', () => ({
  createWordAction: vi.fn().mockResolvedValue({ success: true }),
}));

// next/navigation → mocker si nécessaire
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
```

---

## Commandes

```bash
# Lancer tous les tests (CI)
npm test

# Mode watch pour le développement
npm run test:watch

# Tests d'un fichier spécifique
npx vitest run __tests__/lib/utils.test.ts

# Tests sur les fichiers modifiés depuis le dernier commit
npx vitest run --changed HEAD~1
```

---

## Quand écrire les tests

- **Feature** : les tests de logique pure (`lib/`) accompagnent la PR
- **Bugfix** : un test de non-régression est obligatoire avant le fix
- **Refactoring** : les tests existants doivent passer sans modification
- **Nouveau composant** : les tests d'interaction accompagnent la PR si le composant a une logique d'état
