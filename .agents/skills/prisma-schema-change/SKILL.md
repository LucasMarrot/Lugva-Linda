---
name: prisma-schema-change
description: >
  Procédure sécurisée pour modifier le schéma Prisma de Lugva Linda sans casser les types
  TypeScript ni la base de données. Encode les règles de modélisation du projet (soft-delete,
  contraintes d'unicité, relations). Utilise ce skill quand l'utilisateur veut ajouter un modèle,
  un champ, une relation, ou modifier une contrainte dans prisma/schema.prisma.
---

# Skill : Prisma Schema Change — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Schema : `/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda/prisma/schema.prisma`

## Procédure

### Étape 1 — Modifier le schéma

Éditer `prisma/schema.prisma` en respectant les conventions ci-dessous.

### Étape 2 — Valider la syntaxe

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx prisma validate
```

**Critère** : exit code 0, aucune erreur. Si erreur → corriger avant de continuer.

### Étape 3 — Régénérer le client TypeScript

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx prisma generate
```

Cela met à jour `@prisma/client` avec les nouveaux types.

### Étape 4 — Vérifier les types

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx tsc --noEmit
```

Si des erreurs TypeScript apparaissent → c'est normal si des champs obligatoires ont été ajoutés. Les corriger dans le code source.

### Étape 5 — Documenter dans le commit

Utiliser le scope `schema` dans le commit :
```
chore(schema): ajouter le champ audioUrl au modèle Word
feat(schema): créer le modèle UserPreference avec relation User
```

---

## Règles de modélisation Lugva Linda

### Soft-delete obligatoire

Tout modèle qui contient des données utilisateur DOIT inclure :

```prisma
isDeleted  Boolean  @default(false)
deletedAt  DateTime?
purgeAfter DateTime?
deleteToken BigInt   @default(0)
```

Et la contrainte d'unicité doit inclure `deleteToken` pour permettre le re-ajout après suppression :
```prisma
@@unique([ownerId, languageId, term, mandatoryTag, deleteToken])
```

### Relations — `onDelete` toujours explicite

```prisma
// Données utilisateur → Cascade
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// Références globales → SetNull (pour ne pas perdre des données si la langue est supprimée)
language Language @relation(fields: [languageId], references: [id], onDelete: SetNull)

// Contraintes d'intégrité → Restrict (ex: créateur d'une langue)
creator User @relation(fields: [createdBy], references: [id], onDelete: Restrict)
```

### Index — performance

Tout champ utilisé dans un `where` fréquent doit avoir un `@@index` :

```prisma
@@index([ownerId, languageId, isDeleted, createdAt])
@@index([ownerId, languageId, isDeleted, termNormalized])
```

### Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Modèles | PascalCase | `Word`, `ReviewLog`, `DailyStat` |
| Champs | camelCase | `ownerId`, `termNormalized`, `createdAt` |
| Enums | UPPER_CASE | `ACTIVE`, `TO_COMPLETE`, `AGAIN` |
| Index | Décrire les champs filtrés | `@@index([ownerId, languageId, isDeleted])` |

### Types de champs courants

```prisma
id         String   @id @default(uuid())
createdAt  DateTime @default(now())
updatedAt  DateTime @updatedAt
ownerId    String   // FK vers User.id
languageId String   // FK vers Language.id
```

### Ne pas modifier sans consensus

- La contrainte `@@unique([ownerId, languageId, term, mandatoryTag, deleteToken])` sur `Word`
- La structure des enums `ExerciseCategory`, `ExerciseType`, `ReviewGrade`
- Les champs FSRS sur `Card` (`due`, `stability`, `difficulty`, `state`, etc.)

Ces champs sont couplés à `ts-fsrs` et à la logique de révision. Toute modification nécessite de mettre à jour `lib/fsrs.ts` et `lib/services/review-service.ts`.

---

## Exemples

### Ajouter un champ optionnel

```prisma
model Word {
  // ...champs existants...
  externalUrl  String?  // ← nouveau champ optionnel, pas de migration bloquante
}
```

### Ajouter un nouveau modèle

```prisma
model UserPreference {
  id     String @id @default(uuid())
  userId String @unique
  theme  String @default("system")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Et ajouter la relation inverse sur `User` :
```prisma
model User {
  // ...
  preference UserPreference?
}
```
