---
name: bootstrap-tests
description: >
  Crée un fichier de test Vitest conforme aux conventions de Lugva Linda pour un fichier source
  donné. Calcule automatiquement le chemin miroir dans __tests__/, génère le squelette avec les
  bons imports (describe/it/expect, renderHook, render/screen/userEvent selon le type), et
  propose les cas de test initiaux. Utilise ce skill quand l'utilisateur dit "ajoute des tests",
  "crée un test pour X", ou à l'étape 7 du workflow scaffold-feature.
---

# Skill : Bootstrap Tests — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Procédure

### Étape 1 — Identifier le type de fichier source

| Fichier source | Type de test | Outil |
|---|---|---|
| `lib/**/*.ts` | Test unitaire pur | `describe`, `it`, `expect`, `vi` |
| `hooks/**/*.ts` | Test de hook | `renderHook`, `act` (RTL) |
| `components/**/*.tsx` | Test de composant | `render`, `screen`, `userEvent` (RTL) |
| `actions/**/*.ts` | ⛔ Pas de test | Trop couplé à auth/DB/Prisma |
| `app/**/*.tsx` | ⛔ Pas de test | Trop couplé au routing Next.js |
| `components/ui/**/*.tsx` | ⛔ Pas de test | Primitives Shadcn — pas à tester |

### Étape 2 — Calculer le chemin miroir

```
lib/utils.ts                            → __tests__/lib/utils.test.ts
lib/words/normalization.ts              → __tests__/lib/words/normalization.test.ts
lib/validation/schemas.ts              → __tests__/lib/validation/schemas.test.ts
lib/services/word-policies.ts          → __tests__/lib/services/word-policies.test.ts
lib/services/community-merge.ts        → __tests__/lib/services/community-merge.test.ts
hooks/useCalendarData.ts               → __tests__/hooks/useCalendarData.test.ts
hooks/useReviewSession.ts              → __tests__/hooks/useReviewSession.test.ts
components/shared/StateMessage.tsx     → __tests__/components/shared/StateMessage.test.tsx
components/shared/ConfirmButton.tsx    → __tests__/components/shared/ConfirmButton.test.tsx
```

Créer les dossiers intermédiaires si nécessaire.

### Étape 3 — Générer le squelette

#### Pour `lib/**/*.ts` (test unitaire pur)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myFunction } from '@/lib/path/to/module';

describe('myFunction()', () => {
  it('retourne le résultat attendu pour une entrée valide', () => {
    expect(myFunction('input')).toBe('expected output');
  });

  it('gère les chaînes vides', () => {
    expect(myFunction('')).toBe('');
  });

  it('gère les valeurs null/undefined', () => {
    expect(myFunction(null as unknown as string)).toBe('');
  });
});
```

#### Pour `lib/services/**/*.ts` (mock Prisma obligatoire)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du client Prisma — toujours avant les imports du service
vi.mock('@/lib/prisma', () => ({
  default: {
    word: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';
import { myServiceFunction } from '@/lib/services/my-service';

describe('myServiceFunction()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne les données depuis Prisma', async () => {
    vi.mocked(prisma.word.findMany).mockResolvedValue([]);
    const result = await myServiceFunction('user-id');
    expect(result).toEqual([]);
  });
});
```

#### Pour `lib/validation/schemas.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { mySchema } from '@/lib/validation/schemas';

describe('mySchema', () => {
  it('valide une entrée correcte', () => {
    const result = mySchema.safeParse({ field: 'valid value' });
    expect(result.success).toBe(true);
  });

  it('rejette un champ vide', () => {
    const result = mySchema.safeParse({ field: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('obligatoire');
  });

  it('rejette une valeur trop longue', () => {
    const result = mySchema.safeParse({ field: 'a'.repeat(200) });
    expect(result.success).toBe(false);
  });
});
```

#### Pour `hooks/**/*.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

// Mocker les Server Actions si le hook les appelle
vi.mock('@/actions/word-actions', () => ({
  myAction: vi.fn().mockResolvedValue({ success: true }),
}));

describe('useMyHook()', () => {
  it('retourne l\'état initial correct', () => {
    const { result } = renderHook(() => useMyHook([]));
    expect(result.current.items).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('met à jour l\'état après une action', async () => {
    const { result } = renderHook(() => useMyHook([]));
    await act(async () => {
      await result.current.doSomething();
    });
    expect(result.current.items).toHaveLength(1);
  });
});
```

#### Pour `components/shared/**/*.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/shared/MyComponent';

describe('MyComponent', () => {
  it('affiche le contenu passé en prop', () => {
    render(<MyComponent label="Supprimer" onAction={vi.fn()} />);
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('appelle onAction au clic', async () => {
    const onAction = vi.fn();
    render(<MyComponent label="Supprimer" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```

### Étape 4 — Lancer le test

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx vitest run __tests__/chemin/fichier.test.ts
```

Vérifier que le test s'exécute et que les cas de base passent.

---

## Règles d'écriture

- `describe` : nom de la fonction ou du composant (`normalizeText()`, `ConfirmButton`)
- `it` : phrase décrivant le comportement, sans "should" (`retourne...`, `affiche...`, `appelle...`)
- Pas de tests sur les styles visuels (`className`, couleurs) — fragiles
- Pas de tests sur les layouts Next.js (`layout.tsx`) — trop couplés à l'infra
