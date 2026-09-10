---
name: scaffold-server-action
description: >
  Crée une Server Action Next.js conforme au pattern réel du projet Lugva Linda (6 couches :
  auth, CSRF, rate-limit, service, logging, error mapping). Utilise ce skill quand l'utilisateur
  demande de créer une nouvelle action serveur, une mutation de données, ou quand une feature
  nécessite d'écrire dans la base de données depuis le client.
---

# Skill : Scaffold Server Action — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Fichiers à toucher (dans l'ordre)

1. `lib/validation/schemas.ts` — ajouter le schéma Zod si besoin
2. `lib/services/{domaine}-service.ts` — ajouter la méthode métier
3. `actions/{domaine}-actions.ts` — créer ou compléter le fichier action

## Template complet — Server Action

```typescript
'use server';

import { requireAuthenticatedUser, getCurrentUserProfile } from '@/lib/auth/server';
import { assertCsrfForAction } from '@/lib/security/csrf';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { mySchema } from '@/lib/validation/schemas';
import { myService } from '@/lib/services/my-service';
import { logActionError, logActionSuccess, toActionError } from '@/lib/actions/action-error';
import { revalidatePath } from 'next/cache';

export async function myAction(formData: FormData) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    // 1. Auth — toujours en premier
    const user = await requireAuthenticatedUser();
    userId = user.id;

    // 2. CSRF — obligatoire pour les mutations
    await assertCsrfForAction({ formData, subject: user.id });

    // 3. Rate limiting — key unique par action et user
    assertRateLimit(`my-action:${user.id}`, 30, 60_000);

    // 4. [SI CONTRIBUTEUR] — Résolution de l'owner effectif
    // Décommenter si l'action peut être faite par un CONTRIBUTOR pour un USER cible
    // let effectiveOwnerId = user.id;
    // const profile = await getCurrentUserProfile();
    // if (profile?.role === 'CONTRIBUTOR' && profile.targetOwnerId) {
    //   effectiveOwnerId = profile.targetOwnerId;
    // }

    // 5. Validation Zod
    const parsed = mySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    // 6. Service métier
    await myService.doSomething(user.id, parsed.data);

    // 7. Invalidation cache
    revalidatePath('/path-to-revalidate');

    // 8. Logging succès (métriques)
    logActionSuccess('myAction', userId, startedAt);
  } catch (error) {
    // 9. Logging erreur + mapping pour le client
    logActionError('myAction', userId, error, startedAt);
    throw toActionError(error);
  }
}
```

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Nom de l'action | `verbNounAction` en camelCase | `createWordAction`, `deleteLanguageAction` |
| Fichier action | `{domaine}-actions.ts` | `word-actions.ts`, `language-actions.ts` |
| Rate-limit key | `verb-noun:{userId}` | `create-word:${user.id}` |
| Limites rate-limit | 30 req/min pour mutations, 120 req/min pour lectures | voir word-actions.ts |

## Schéma Zod — Patterns

```typescript
// Dans lib/validation/schemas.ts

// Toujours exporter les types inférés
export const mySchema = z.object({
  field: nonEmptyTextSchema.max(128, 'Trop long.'),
  id: wordIdSchema.optional(),
});
export type MyInput = z.infer<typeof mySchema>;

// Schémas d'ID réutilisables (ne pas recréer)
export { languageIdSchema, wordIdSchema, cardIdSchema };
```

## Service métier — Patterns

```typescript
// Dans lib/services/my-service.ts

import prisma from '@/lib/prisma';
import { NotFoundError, ForbiddenError, DuplicateError } from '@/lib/errors';

export async function doSomething(ownerId: string, data: MyInput) {
  // Vérifier ownership avant toute opération
  const existing = await prisma.myModel.findUnique({ where: { id: data.id } });
  if (!existing) throw new NotFoundError('Ressource introuvable.');
  if (existing.ownerId !== ownerId) throw new ForbiddenError('Accès refusé.');

  // Gérer les contraintes d'unicité
  // Utiliser try/catch sur les violations de contrainte Prisma (P2002)
  try {
    return await prisma.myModel.update({ where: { id: data.id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new DuplicateError('Cette entrée existe déjà.');
    }
    throw err;
  }
}
```

## Checklist avant de soumettre

- [ ] `requireAuthenticatedUser()` en première ligne du try
- [ ] `assertCsrfForAction()` présent
- [ ] `assertRateLimit()` avec clé unique par user
- [ ] Validation Zod avec `safeParse` (jamais `parse` qui throw)
- [ ] `logActionSuccess` et `logActionError` présents
- [ ] `toActionError(error)` dans le catch (pas `throw error` directement)
- [ ] `revalidatePath` sur les routes affectées
- [ ] Fichier action dans `actions/` (jamais dans `lib/`, `components/`, ou `app/`)

## Anti-patterns

- ⛔ `throw error` directement dans catch → utiliser `throw toActionError(error)`
- ⛔ `return { success: false, error: ... }` → les actions Lugva Linda throw, elles ne retournent pas d'erreur
- ⛔ Logique métier dans le fichier action → tout dans `lib/services/`
- ⛔ Requêtes Prisma directes dans l'action → passer par le service
- ⛔ Oublier `'use server'` en première ligne
