# Theme Switch Spec (Preparation)

## Objectif

Preparer une implementation future du theme switch `light/dark/system` sans modifier le rendu actuel dans cette phase.

## Hors scope (phase actuelle)

- Aucun bouton de toggle theme dans l'UI.
- Aucune persistance utilisateur activee.
- Aucun changement de design global.

## Cibles de la prochaine phase

1. Ajouter un mode `system` par defaut.
2. Permettre un override utilisateur (`light` ou `dark`).
3. Garder une hydratation stable (pas de flash de theme).
4. Preserver les tokens semantiques existants.

## Etat actuel

- Les tokens `:root` et `.dark` existent deja dans `app/globals.css`.
- Le layout n'applique pas encore de strategie de selection/persistance de theme.

## Strategie proposee

1. Source de verite:

- Theme utilisateur stocke dans `localStorage` avec valeur `light|dark|system`.
- Valeur effective resolue au runtime:
  - `light` => classe `light` (ou absence de `dark`)
  - `dark` => classe `dark`
  - `system` => preference OS via media query

2. Application du theme:

- Appliquer la classe sur `html` des le chargement initial via script inline minimal anti-flash.
- Synchroniser les changements utilisateur avec un provider client dedie.

3. API front interne:

- `ThemeProvider` (client): expose `theme`, `resolvedTheme`, `setTheme`.
- Hook `useTheme`: consomme le provider.
- Composant `ThemeToggle` (futur): UI de selection.

## Contraintes techniques

1. SSR/CSR:

- Eviter les mismatches hydratation en resolvant un etat initial coherent.
- Le script inline doit executer avant paint principal.

2. Accessibilite pragmatique:

- Le toggle theme doit etre clavier-friendly.
- Etat selectionne explicite (aria).

3. Compatibilite:

- Garder les classes token-first (`bg-background`, `text-foreground`, etc.).
- Eviter les couleurs hardcodees dans les composants metier.

## Plan implementation (future)

1. Infra:

- Ajouter provider theme global dans `app/layout.tsx`.
- Ajouter script anti-flash theme.

2. UI:

- Ajouter controle theme dans `settings` (quand la page est implementee).
- Optionnel: lecture rapide du mode dans un menu secondaire.

3. QA:

- Verifier transitions login/dashboard/words/review en light, dark, system.
- Verifier persistance apres refresh et fermeture/reouverture.

## Criteres de validation

- Aucun flash visible de theme au chargement.
- Choix utilisateur persiste entre sessions.
- Mode system suit la preference OS.
- Aucun composant critique ne perd de contraste lisible.
