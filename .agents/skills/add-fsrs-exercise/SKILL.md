---
name: add-fsrs-exercise
description: >
  Guide l'implémentation d'un nouveau type d'exercice FSRS dans Lugva Linda. Encode les règles
  critiques : FSRS s'applique uniquement en révision solo (jamais en Battle), la progression est
  indépendante par ExerciseType pour chaque mot, et les cartes (Card) sont créées automatiquement
  à l'ajout d'un mot. Utilise ce skill quand l'utilisateur veut ajouter un exercice comme
  la prononciation, l'écoute, l'écriture, ou tout nouveau mode d'apprentissage solo.
---

# Skill : Add FSRS Exercise — Lugva Linda

## Répertoire de travail

`/Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda`

## Architecture FSRS du projet

### Enums (source de vérité dans `prisma/schema.prisma`)

```prisma
enum ExerciseCategory {
  READING       // Lecture : voir le mot → trouver la traduction
  WRITING       // Écriture : voir la traduction → écrire le mot
  PRONUNCIATION // Prononciation : entendre/lire → prononcer
}

enum ExerciseType {
  RECOGNITION   // Reconnaissance (READING)
  REVERSE       // Reverse recognition (READING)
  SPELLING      // Orthographe (WRITING)
  SPEAKING      // Expression orale (PRONUNCIATION)
}

enum ReviewGrade {
  AGAIN  // Échec — à revoir très bientôt
  HARD   // Difficile — intervalle réduit
  GOOD   // Correct — intervalle normal
  EASY   // Facile — intervalle augmenté
}
```

### Modèle Card

Chaque `(Word × ExerciseType)` génère une `Card` unique :
- Contrainte : `@@unique([wordId, type])`
- Une Card contient les données FSRS : `due`, `stability`, `difficulty`, `state`, `reps`, `lapses`
- **Une Card par ExerciseType, pas par ExerciseCategory**

### Règle fondamentale — FSRS solo uniquement

```
✅ Révision solo → crée des ReviewLog, met à jour Card (due, stability, difficulty...)
❌ Battle/Duel  → ZÉRO impact FSRS, ZÉRO ReviewLog, ZÉRO mise à jour Card
```

---

## Procédure pour ajouter un nouveau type d'exercice

### Étape 1 — Vérifier les enums existants

Avant tout : est-ce que le nouveau type d'exercice correspond à un `ExerciseType` existant, ou faut-il en créer un ?

Types actuels : `RECOGNITION`, `REVERSE`, `SPELLING`, `SPEAKING`

Si le nouveau type n'existe pas → invoquer le skill `prisma-schema-change` pour ajouter l'enum.

### Étape 2 — Si nouvel ExerciseType : modifier le schéma

```bash
# Dans prisma/schema.prisma, ajouter à ExerciseType :
enum ExerciseType {
  RECOGNITION
  REVERSE
  SPELLING
  SPEAKING
  LISTENING   # ← exemple de nouveau type
}
```

Puis régénérer le client :
```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda && npx prisma generate
```

### Étape 3 — Créer les cartes pour les mots existants

Les cartes sont créées dans `lib/services/word-service.ts` à la création d'un mot. Si un nouveau type est ajouté, il faut une migration pour créer les cartes manquantes.

Localiser la fonction de création de cartes dans `word-service.ts` (chercher `prisma.card.create` ou `prisma.card.createMany`) et ajouter le nouveau type.

### Étape 4 — Créer le composant d'exercice

Structure recommandée :
```
components/review/flashcard/faces/
├── RectoCard.tsx        ← Face avant (question posée à l'utilisateur)
├── VersoCard.tsx        ← Face arrière (réponse révélée)
└── MyNewExercise/       ← Nouveau dossier pour le nouvel exercice
    ├── RectoMyNew.tsx
    └── VersoMyNew.tsx
```

Le composant reçoit une `Card & { word: Word }` en prop.

### Étape 5 — Brancher dans le moteur de révision

Le moteur de révision est dans `hooks/useReviewSession.ts` et `lib/services/review-service.ts`.

Dans `useReviewSession.ts` : ajouter le nouveau type dans le switch/map qui détermine quel composant afficher.

### Étape 6 — Schéma de validation

Dans `lib/validation/schemas.ts`, vérifier que `ExerciseType` est bien typé. Après modification du schéma Prisma, les types sont automatiquement mis à jour via `@prisma/client`.

### Étape 7 — Tests unitaires

```bash
# Tester la logique FSRS du nouvel exercice
# Vérifier que les cartes sont bien créées avec le bon type
# Vérifier que les ReviewLog sont bien générés en solo
```

Invoquer le skill `bootstrap-tests` pour créer le fichier de test.

### Étape 8 — Vérification qualité

```bash
cd /Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda
npx tsc --noEmit
npm run lint
npm test
```

---

## Règles critiques à ne jamais violer

### FSRS solo uniquement

```typescript
// ✅ En révision solo — processReviewAction dans review-actions.ts
// Met à jour la Card et crée un ReviewLog
await processReview({ cardId, grade, durationMs });

// ❌ En Battle — duel-actions.ts
// Ne doit JAMAIS appeler processReview ou modifier une Card
// Le Battle n'a aucun effet sur la planification FSRS
```

### Progression indépendante par type

Un utilisateur peut maîtriser `SPEAKING` mais avoir `RECOGNITION` en état `AGAIN`.
Ne jamais synchroniser ou copier les progrès entre types d'exercice.

### Accès au wrapper FSRS

```typescript
// Toujours passer par lib/fsrs.ts — ne pas importer ts-fsrs directement
import { scheduleCard, initCard } from '@/lib/fsrs';
```

---

## Mapping ExerciseCategory → ExerciseType

| ExerciseCategory | ExerciseType(s) associés |
|---|---|
| `READING` | `RECOGNITION`, `REVERSE` |
| `WRITING` | `SPELLING` |
| `PRONUNCIATION` | `SPEAKING` |

Pour un futur exercice d'écoute (LISTENING) : créer une nouvelle `ExerciseCategory` et un nouveau `ExerciseType` correspondant.

---

## Fichiers clés à connaître

| Fichier | Rôle |
|---|---|
| `lib/fsrs.ts` | Wrapper `ts-fsrs` — `scheduleCard()`, `initCard()` |
| `lib/services/review-service.ts` | `getDueCards()`, `processCardReview()` |
| `lib/validation/schemas.ts` | `processReviewSchema`, `getDueWordsSchema`, `gradeSchema` |
| `actions/review-actions.ts` | `processReviewAction`, `getDueCardsAction` |
| `hooks/useReviewSession.ts` | Logique de session côté client |
| `components/review/` | Tous les composants de révision |
| `prisma/schema.prisma` | Source de vérité pour `ExerciseCategory`, `ExerciseType`, `ReviewGrade` |
