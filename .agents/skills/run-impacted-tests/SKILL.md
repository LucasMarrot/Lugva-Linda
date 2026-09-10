---
name: run-impacted-tests
description: >
  Lance Vitest uniquement sur les fichiers de tests affectés par les modifications récentes.
  Optimise le feedback loop en évitant de lancer toute la suite quand seuls quelques fichiers ont changé.
---

# Skill : Tests Impactés — Lugva Linda

## Quand utiliser ce skill

- En cours de développement pour un feedback rapide
- Après une modification de `lib/` ou d'un hook pour vérifier les régressions locales
- Avant un commit pour s'assurer que les tests directs passent (le CI vérifiera le reste)

## Contexte

Répertoire de travail : `lugva-linda/`
Convention des tests : `__tests__/**/*.test.{ts,tsx}`

## Commandes

### Tests des fichiers modifiés depuis le dernier commit

```bash
npx vitest run --changed HEAD~1
```

Vitest détecte automatiquement les fichiers de test qui importent (directement ou transitivement) des modules modifiés.

### Tests des fichiers modifiés non encore commités (working tree)

```bash
npx vitest run --changed
```

### Tests d'un fichier ou d'un dossier spécifique

```bash
# Un seul fichier de test
npx vitest run __tests__/lib/utils.test.ts

# Tous les tests d'un dossier
npx vitest run __tests__/lib/

# Pattern de fichiers
npx vitest run __tests__/lib/validation/
```

### Tests en mode watch (développement)

```bash
npm run test:watch
```

Vitest re-lance automatiquement les tests affectés à chaque sauvegarde de fichier.

## Correspondances sources → tests

| Fichier source modifié | Test à lancer |
|---|---|
| `lib/utils.ts` | `__tests__/lib/utils.test.ts` |
| `lib/words/normalization.ts` | `__tests__/lib/words/normalization.test.ts` |
| `lib/validation/schemas.ts` | `__tests__/lib/validation/schemas.test.ts` |
| `lib/services/word-policies.ts` | `__tests__/lib/services/word-policies.test.ts` |
| `lib/services/community-merge.ts` | `__tests__/lib/services/community-merge.test.ts` |
| `hooks/useCalendarData.ts` | `__tests__/hooks/useCalendarData.test.ts` |
| `components/shared/StateMessage.tsx` | `__tests__/components/shared/StateMessage.test.tsx` |

## Interprétation des résultats

```
✓ __tests__/lib/utils.test.ts (8 tests) 12ms
✗ __tests__/lib/validation/schemas.test.ts (3 tests | 1 failed) 45ms

 FAIL  __tests__/lib/validation/schemas.test.ts
  ● wordWriteSchema › should reject empty term
    Expected: ValidationError
    Received: success
```

→ Analyser l'échec, corriger la source, relancer.

## Note sur `--changed`

L'option `--changed` nécessite un repository Git propre (fichiers trackés).
Si des fichiers ne sont pas encore trackés par Git, les ajouter d'abord :
```bash
git add --intent-to-add <fichier>  # Track sans stager
npx vitest run --changed
```
