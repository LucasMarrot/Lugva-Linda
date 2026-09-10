---
name: code-quality
description: >
  Standards de qualité TypeScript/React non-négociables pour Lugva Linda.
  Appliqués à chaque review et à chaque implémentation.
---

# Standards de Qualité — Lugva Linda

## TypeScript Strict

### Typage — règles inviolables
```typescript
// ❌ REJETÉ immédiatement
const data: any = response;
const user = response as unknown as User;
function handler(e: any) {}

// ✅ Obligatoire
const data: ApiResponse<Word> = response;
function handler(e: React.FormEvent<HTMLFormElement>) {}
```

- **Zéro `any`** explicite. Si le type est inconnu, utiliser `unknown` et le narrowing.
- **Zéro assertion abusive** (`as`, `!`). Les nullish doivent être gérés explicitement.
- **Inférer autant que possible** — ne pas déclarer de type quand TypeScript peut l'inférer.
- **Toujours typer les retours** des fonctions non-triviales et des Server Actions.

### Types et interfaces
```typescript
// Préférer les types aux interfaces pour les objets simples
type WordCardProps = {
  word: Word;
  onEdit?: () => void;
};

// Utiliser les types inférés des schémas Zod
type CreateWordInput = z.infer<typeof createWordFormSchema>;
```

---

## React et Composants

### États obligatoires

Tout composant qui charge des données **doit** gérer les 4 états :

```tsx
// ❌ Composant incomplet
function WordList({ words }: { words: Word[] }) {
  return <ul>{words.map(w => <li key={w.id}>{w.term}</li>)}</ul>;
}

// ✅ Composant complet
function WordList({ words, isLoading, error }: WordListProps) {
  if (isLoading) return <Spinner />;
  if (error) return <StateMessage variant="error" message={error} />;
  if (words.length === 0) return <StateMessage variant="empty" message="Aucun mot" />;
  return <ul>{words.map(w => <li key={w.id}>{w.term}</li>)}</ul>;
}
```

Les 4 états obligatoires : **loading**, **error**, **empty**, **data**.

### Classes Tailwind — `cn()` obligatoire
```typescript
// ❌ Concaténation naïve
className={`button ${isActive ? 'bg-primary' : 'bg-secondary'}`}

// ✅ Via cn() de @/lib/utils
className={cn('button', isActive ? 'bg-primary' : 'bg-secondary')}
```

### Responsive mobile-first obligatoire
```tsx
// ❌ Desktop-first interdit
<div className="text-lg md:text-sm">

// ✅ Mobile-first
<div className="text-sm md:text-base lg:text-lg">
```

L'application est une **PWA mobile-first**. Chaque composant doit être utilisable sur un écran de 375px sans scroll horizontal.

### Accessibilité minimale
- Tous les boutons ont un `aria-label` si leur contenu est uniquement une icône.
- Les formulaires utilisent `<Label>` + `htmlFor` pour chaque champ.
- Les états de chargement utilisent `aria-busy="true"`.
- Les dialogues/drawers gèrent le focus trap (Shadcn le fait nativement).

---

## Server Actions

### Pattern obligatoire — 6 couches

```typescript
// actions/example-actions.ts
'use server';

import { requireAuthenticatedUser, getCurrentUserProfile } from '@/lib/auth/server';
import { assertCsrfForAction } from '@/lib/security/csrf';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { exampleService } from '@/lib/services/example-service';
import { logActionError, logActionSuccess, toActionError } from '@/lib/actions/action-error';
import { revalidatePath } from 'next/cache';

export async function exampleAction(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    // Couche 1 — Auth
    const user = await requireAuthenticatedUser();
    userId = user.id;

    // Couche 2 — CSRF
    await assertCsrfForAction({ formData, subject: user.id });

    // Couche 3 — Rate limiting
    assertRateLimit(`example-action:${user.id}`, 30, 60_000);

    // Optionnel — Rôle CONTRIBUTOR (actions qui opèrent sur un propriétaire cible)
    let effectiveOwnerId = user.id;
    const profile = await getCurrentUserProfile();
    if (profile?.role === 'CONTRIBUTOR' && profile.targetOwnerId) {
      effectiveOwnerId = profile.targetOwnerId;
    }

    // Couche 4 — Service métier
    await exampleService.doSomething(effectiveOwnerId, parsedData);

    revalidatePath('/path');

    // Couche 5 — Logging succès
    logActionSuccess('exampleAction', userId, startedAt);
  } catch (error) {
    // Couche 6 — Logging erreur + mapping client
    logActionError('exampleAction', userId, error, startedAt);
    throw toActionError(error);
  }
}
```

### Utilitaires de couche action — imports obligatoires

| Utilitaire | Import | Rôle |
|---|---|---|
| `requireAuthenticatedUser()` | `@/lib/auth/server` | Auth Supabase, lève `UnauthorizedError` |
| `getCurrentUserProfile()` | `@/lib/auth/server` | Profil DB complet (rôle, couleur, langue active) |
| `assertCsrfForAction()` | `@/lib/security/csrf` | Protection CSRF (same-origin) |
| `assertRateLimit()` | `@/lib/security/rate-limit` | Throttling in-memory par clé |
| `logActionSuccess()` | `@/lib/actions/action-error` | Métriques d'observabilité |
| `logActionError()` | `@/lib/actions/action-error` | Logging structuré JSON |
| `toActionError()` | `@/lib/actions/action-error` | Mapping `AppError` → `Error` client |

**⛔ Interdit :**
- Lancer un service sans `requireAuthenticatedUser()` d'abord
- Retourner `{ success, error }` directement — utiliser `toActionError()` pour throw
- Oublier `logActionError` dans le catch

### Erreurs métier
Utiliser exclusivement les erreurs typées de `@/lib/errors` :
- `UnauthorizedError` — session manquante
- `ForbiddenError` — droits insuffisants
- `NotFoundError` — ressource introuvable
- `ValidationError` — données invalides
- `DuplicateError` — conflit de contrainte unique
- `StorageError` — erreur Supabase Storage

---

## CSS et Styling

### CSS custom properties du design system
Variables disponibles dans `app/globals.css` — utiliser via Tailwind :
- Couleurs : `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, etc.
- Bordures : `border-border`, `rounded-sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`4xl`
- Utilitaires custom : `ui-motion-interactive`, `ui-tap-feedback`

**⛔ Interdit :**
- Écrire du CSS inline (sauf CSS custom properties injectées dynamiquement via `style={{ '--var': value }}`)
- Créer un fichier `.css` ou `styled` — tout passe par Tailwind + les variables CSS existantes
- Redéfinir des couleurs déjà dans le design system

### Animations
Préférer `tw-animate-css` (déjà installé) et `framer-motion` (déjà installé) aux transitions CSS manuelles.
Utiliser la classe `ui-motion-interactive` pour les éléments interactifs.

---

## Git — Conventional Commits

Format obligatoire : `type(scope): description en minuscule`

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité utilisateur |
| `fix` | Correction de bug |
| `refactor` | Réécriture sans changement de comportement |
| `test` | Ajout ou modification de tests |
| `chore` | Maintenance, deps, config |
| `docs` | Documentation uniquement |
| `style` | Formatage, espaces (pas de logique) |
| `perf` | Optimisation de performance |

Scopes applicatifs : `encyclopedia`, `review`, `duel`, `auth`, `settings`, `community`, `dashboard`, `shared`, `lib`, `api`, `ci`, `schema`

Exemples :
```
feat(encyclopedia): ajouter le filtre par statut de mot
fix(review): corriger le calcul FSRS pour les cartes AGAIN
chore(ci): ajouter l'étape de tests Vitest
test(lib): ajouter les tests unitaires sur schemas.ts
```

**⛔ Commits interdits :**
- `fix: fix bug` — trop vague
- `update files` — non-descriptif
- Commits qui mélangent refactoring + feature + fix
