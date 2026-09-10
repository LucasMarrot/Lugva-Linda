---
name: verify-quality
description: >
  Lance la suite complète de vérification qualité : TypeScript, ESLint, Prettier, tests Vitest.
  À exécuter avant tout commit ou merge. Chaque échec est un bloquant.
---

# Skill : Vérification Qualité — Lugva Linda

## Quand utiliser ce skill

- Avant tout commit sur une feature ou un fix
- En réponse à une question "est-ce que le code est propre ?"
- Avant d'ouvrir une PR
- Après un refactoring pour détecter les régressions

## Contexte

Répertoire de travail : `lugva-linda/` (là où se trouve `package.json`)

## Étapes d'exécution

### 1. TypeScript — Vérification de types (BLOQUANT)

```bash
npx tsc --noEmit
```

**Critère de succès** : aucune sortie, exit code 0.

Erreurs fréquentes et solutions :
- `Type 'X' is not assignable to type 'Y'` → corriger le typage, ne pas caster avec `as`
- `Object is possibly 'null'` → ajouter un guard (`if (!value) return`) ou `?.`
- `Property 'X' does not exist` → vérifier l'import et le type source

---

### 2. ESLint (BLOQUANT)

```bash
npm run lint
```

**Critère de succès** : exit code 0, aucun warning sur les règles critiques.

Ignorer les warnings Prettier (désactivés dans la config ESLint actuelle).

---

### 3. Prettier — Vérification du format (BLOQUANT)

```bash
npx prettier --check .
```

**En cas d'échec**, formater automatiquement :
```bash
npm run format
```

Config Prettier ([`.prettierrc`](file:///Users/lucas/Desktop/Projets/Lugva-Linda/lugva-linda/.prettierrc)) :
- `semi: true` — points-virgules obligatoires
- `singleQuote: true` — guillemets simples
- `trailingComma: "all"` — virgules trailing
- `printWidth: 80` — largeur max 80 caractères
- Plugin Tailwind : tri automatique des classes

---

### 4. Tests Vitest (BLOQUANT quand des tests existent)

```bash
npm test
```

**Critère de succès** : exit code 0, tous les tests passent.

Si aucun test n'existe encore : exit code 0 avec `No test files found` — acceptable.

Pour un fichier spécifique :
```bash
npx vitest run __tests__/lib/utils.test.ts
```

---

### 5. Prisma Schema (SI le schéma a été modifié)

```bash
npx prisma validate
```

---

## Rapport de sortie

À la fin de chaque exécution, produire un résumé :

```
✅ TypeScript — OK (0 erreurs)
✅ ESLint — OK (0 erreurs)
✅ Prettier — OK (tous les fichiers conformes)
✅ Vitest — OK (X tests passés)

→ Code prêt pour commit.
```

ou

```
❌ TypeScript — 3 erreurs
✅ ESLint — OK
⚠️  Prettier — 2 fichiers non conformes (exécuter npm run format)
✅ Vitest — OK

→ Corriger TypeScript avant de committer.
```
