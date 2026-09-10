---
name: scaffold-feature
description: >
  Workflow complet en 8 étapes pour créer une nouvelle feature verticale dans Lugva Linda.
  Couvre de l'audit de réutilisation jusqu'au commit, en passant par le schéma Zod, le service
  métier, la Server Action, les composants UI, la route Next.js, les tests et la vérification
  qualité. Utilise ce skill quand l'utilisateur demande d'implémenter une nouvelle fonctionnalité.
---

# Skill : Scaffold Feature — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Les 8 Étapes

---

### Étape 1 — Audit de réutilisation (BLOQUANT)

Avant d'écrire une seule ligne de code, répondre à chaque question :

```
[ ] Composants Shadcn (components/ui/) réutilisables ?
    → Voir architecture.md : Button, Input, Dialog, Drawer, Select, Badge, Card...
[ ] Composants shared (components/shared/) réutilisables ?
    → PageHeader, SectionHeader, StateMessage, ConfirmButton, WordListItem, WordTags...
[ ] Hooks (hooks/) réutilisables ou extensibles ?
    → useReviewSession, useDuelGame, useCalendarData, useWordMutation...
[ ] Schémas Zod existants dans lib/validation/schemas.ts ?
    → Étendre plutôt que créer
[ ] Service métier existant dans lib/services/ ?
    → word-service.ts (42KB !), review-service.ts, language-service.ts, daily-snapshot.ts
[ ] Utilitaires lib/utils.ts, lib/words/* applicables ?
    → cn(), normalizeText(), frenchPluralize(), formatConcept()...
[ ] Provider existant dans components/providers/ ?
    → ActiveLanguageProvider, UserProvider, WordModalProvider, WordMutationProvider...
```

**Règle** : si un composant générique est nécessaire → `components/shared/`, jamais inline.

---

### Étape 2 — Schéma Zod

Fichier : `lib/validation/schemas.ts`

```typescript
// Réutiliser les primitives existantes
export { nonEmptyTextSchema, languageIdSchema, wordIdSchema };

// Ajouter le nouveau schéma
export const myFeatureSchema = z.object({
  // ...
});
export type MyFeatureInput = z.infer<typeof myFeatureSchema>;
```

---

### Étape 3 — Service métier

Fichier : `lib/services/{domaine}-service.ts` (créer ou compléter)

- Toutes les requêtes Prisma passent par ici, jamais depuis les actions ou les composants
- Vérifier ownership avant toute mutation (`word.ownerId !== userId` → `ForbiddenError`)
- Utiliser les erreurs typées de `@/lib/errors`

---

### Étape 4 — Server Action

Invoquer le skill `scaffold-server-action` pour le template complet.

Fichier : `actions/{domaine}-actions.ts`
- Pattern 6 couches obligatoire
- `'use server'` en première ligne

---

### Étape 5 — Composants UI

Dossier : `components/{feature}/`

Contraintes :
- Mobile-first : fonctionnel à 375px, pas de scroll horizontal
- 4 états obligatoires : `loading` → `<Spinner />`, `error` → `<StateMessage variant="error">`, `empty` → `<StateMessage variant="empty">`, `data` → contenu
- `cn()` pour toutes les classes conditionnelles
- Path alias `@/*` uniquement, jamais de chemins relatifs
- `aria-label` sur tous les boutons icône

Si un nouveau composant **générique** est créé :
1. Le placer dans `components/shared/`
2. L'ajouter à `components/shared/index.ts` (barrel export)

---

### Étape 6 — Route Next.js

Dossier : `app/(main)/{feature}/`

```
app/(main)/my-feature/
├── page.tsx        ← RSC : auth + fetch données via data/ ou service
├── loading.tsx     ← Skeleton de chargement (optionnel)
└── error.tsx       ← <RouteErrorState /> (optionnel)
```

Page RSC pattern :
```typescript
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function MyFeaturePage() {
  const user = await requireAuthenticatedUser().catch(() => redirect('/auth/login'));
  const data = await myService.getData(user.id);
  return <MyFeatureClient initialData={data} />;
}
```

---

### Étape 7 — Tests

Invoquer le skill `bootstrap-tests` pour les fichiers `lib/` et `hooks/` créés.

Priorités :
1. Tests unitaires des fonctions `lib/` pures créées → obligatoires
2. Tests des hooks si logique d'état complexe → recommandés
3. Tests des composants si interactions non-triviales → optionnels

---

### Étape 8 — Vérification qualité

Invoquer le skill `verify-quality` :

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda

npx tsc --noEmit    # ← BLOQUANT
npm run lint         # ← BLOQUANT
npx prettier --check .  # ← formater si nécessaire
npm test             # ← BLOQUANT si des tests existent
```

Si tout passe → invoquer le skill `smart-commit`.

---

## Checklist finale

- [ ] Audit réutilisation effectué (étape 1)
- [ ] Aucun composant UI créé si Shadcn l'offre déjà
- [ ] Nouveaux composants génériques dans `components/shared/` + barrel export
- [ ] Server Action avec les 6 couches
- [ ] 4 états gérés dans tous les composants data-fetching
- [ ] Mobile-first (375px sans scroll horizontal)
- [ ] TypeScript strict : zéro `any`, types inférés au max
- [ ] `tsc`, `lint`, `prettier`, `test` tous verts
