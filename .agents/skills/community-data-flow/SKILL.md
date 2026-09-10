---
name: community-data-flow
description: >
  Encode les règles de collaboration encyclopédique de Lugva Linda : propriété des mots,
  import communautaire (copie avec sourceWordId), langues globales vs mots privés, fusion
  sélective de champs. Utilise ce skill quand une feature touche à la consultation des
  encyclopédies d'autres membres, à l'import de mots communautaires, ou à toute interaction
  cross-utilisateurs sur les données de vocabulaire.
---

# Skill : Community Data Flow — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Modèle de données clé

```
User (ownerId)
  └── Word[] (ownerId = User.id)
        ├── sourceWordId? → Word (le mot source si copié)
        └── copies[]     → Word[] (les copies de ce mot chez d'autres users)

Language (globale, partagée par tous)
  └── Word[] (tous les mots de cette langue, tous propriétaires confondus)
```

---

## Règles fondamentales

### 1. Propriété stricte — ownerId

Un mot appartient à **un seul utilisateur** (`ownerId`). Jamais de mutation cross-owner.

```typescript
// ✅ Correct — vérifier ownership avant toute mutation
const word = await prisma.word.findUnique({ where: { id: wordId } });
if (!word || word.ownerId !== userId) throw new ForbiddenError('Accès refusé.');

// ❌ Interdit — modifier un mot sans vérifier l'ownership
await prisma.word.update({ where: { id: wordId }, data: { term: 'nouveau' } });
```

### 2. Langues globales

Les langues (`Language`) sont **communes à toute l'application**. Elles ne sont pas filtrées par utilisateur en lecture.

```typescript
// ✅ Toutes les langues de l'app
const languages = await prisma.language.findMany();

// ✅ Mots d'un user dans une langue
const words = await prisma.word.findMany({
  where: { ownerId: userId, languageId, isDeleted: false },
});

// ✅ Mots d'un AUTRE user dans une langue (lecture seule)
const communityWords = await prisma.word.findMany({
  where: { ownerId: otherUserId, languageId, isDeleted: false },
});
```

### 3. Import = copie indépendante

L'import d'un mot communautaire crée une **copie** dans l'encyclopédie de l'utilisateur. Après la copie, les deux mots évoluent indépendamment.

```typescript
// Flux d'import (voir importCommunityWordForUser dans word-service.ts)
const copiedWord = await prisma.word.create({
  data: {
    ...fieldsFromSourceWord,
    ownerId: importingUserId,        // ← nouveau propriétaire
    createdById: importingUserId,
    sourceWordId: sourceWord.id,     // ← traçabilité de l'origine
    // Les champs sélectionnés peuvent être fusionnés ou remplacés
  },
});
```

**Ne jamais créer de référence partagée** — toujours copier les données.

### 4. Fusion sélective (CommunityImportSelection)

L'utilisateur choisit quels champs importer depuis le mot source. Le schéma est dans `lib/validation/schemas.ts` :

```typescript
// Champs que l'utilisateur peut choisir d'importer
type CommunityImportSelection = {
  useCommunityTranslation: boolean;
  keepOwnTranslation: boolean;
  communityTagKeys: string[];
  keepOwnTagKeys: string[];
  useCommunityAudio: boolean;
  keepOwnAudio: boolean;
  communityNoteBlockIds: string[];
  keepOwnNoteBlockIds: string[];
};
```

La logique de fusion est dans `lib/words/community.ts` (fonctions `defaultCopyFieldOptions`, `defaultWordMergeStrategy`).

### 5. Affichage communautaire — couleur utilisateur

Chaque utilisateur a un `colorHex` (`User.colorHex`). Pour afficher les mots d'un autre membre, toujours récupérer la couleur du propriétaire et l'afficher visuellement.

```typescript
// Requête avec couleur du propriétaire
const words = await prisma.word.findMany({
  where: { languageId, isDeleted: false },
  include: { owner: { select: { colorHex: true, username: true } } },
});
```

Le hook `useUserColor` et le composant `ColorSelection` sont dans `@/components/shared`.

### 6. Lecture seule — encyclopédie d'un autre membre

Consulter l'encyclopédie d'un autre membre = lecture seule stricte. Aucune action de mutation n'est accessible. Seule l'action "Ajouter à mon encyclopédie" (import = copie) est disponible.

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `lib/services/word-service.ts` | `importCommunityWordForUser()`, `getCommunityWordImportPreview()`, `listCommunityMembers()`, `listMemberWordsInLanguage()` |
| `lib/words/community.ts` | `defaultCopyFieldOptions`, `defaultWordMergeStrategy`, `CopyFieldOptions` |
| `hooks/useCommunityImport.ts` | Hook de gestion d'état d'import |
| `components/shared/community-import/` | Composants de l'interface d'import |
| `components/providers/CommunityImportProvider.tsx` | Provider état import communautaire |

---

## Checklist feature communautaire

- [ ] Ownership vérifié côté serveur avant toute mutation
- [ ] Import = création d'un nouveau mot avec `sourceWordId`, pas de modification du source
- [ ] Couleur du propriétaire affichée sur les mots communautaires
- [ ] Lecture seule stricte sur l'encyclopédie d'un autre membre
- [ ] Réutiliser `listCommunityMembers()` et `listMemberWordsInLanguage()` de `word-service.ts`
- [ ] Réutiliser les composants `community-import/` existants pour l'UI d'import
- [ ] Les langues sont globales — ne pas filtrer par utilisateur en lecture
