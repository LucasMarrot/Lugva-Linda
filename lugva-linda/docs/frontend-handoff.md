# Frontend Handoff

## Objectif

Ce document sert de reference rapide pour composer des ecrans front de Lugva Linda sans reintroduire de dette UX/architecture.

## Conventions de composition

1. Page server-first:

- Recuperer les donnees et faire les `redirect(...)` dans `app/**/page.tsx`.
- Passer les donnees minimales aux composants client.

2. Composant orchestration vs presentation:

- Orchestrateur: gere les hooks, actions, effets, URL state, et branche les sous-composants.
- Presentation: recoit des props simples, sans appel reseau ni logique metier lourde.

3. Etats UI standards:

- Inline feedback via `StateMessage` pour `loading`, `empty`, `error`, `info`.
- Erreurs de route via `RouteErrorState` dans `app/**/error.tsx`.
- Chargements de route via `PageLoadingState` dans `app/**/loading.tsx`.

4. Navigation:

- Ne jamais lier une route inexistante.
- Toute action de navigation doit conserver le contexte utile (`lang`, filtres, etc.) quand pertinent.

5. Feedback utilisateur:

- Pas de `alert(...)` navigateur.
- Utiliser toast bas d'ecran pour erreurs et confirmations non bloquantes.

## Conventions de style

1. Tokens:

- Couleurs: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive`.
- Bordures/surfaces: `border-border`, `rounded-lg`/`rounded-xl`/`rounded-2xl`, `shadow-sm`.

2. Espacement:

- Echelle principale: `p-4`, `p-6`, `gap-2`, `gap-3`, `space-y-4`, `space-y-8`.

3. Interactions:

- Utiliser les classes utilitaires partagees:
  - `ui-motion-interactive`
  - `ui-tap-feedback`
- Eviter les durees/easing custom hors besoin explicite.

4. Mobile first:

- Penser iPhone 15 en premier.
- Si nav fixe en bas, reserver un espace de contenu avec `var(--bottom-nav-height)`.
- Preferer `dvh` a `vh` sur les ecrans plein hauteur interactifs.

## Exemples de composition

### Exemple A: page dashboard

1. `app/page.tsx`:

- Auth + chargement donnees server.
- Gestion des redirects (`/auth/login`, `/setup`, `?lang=`).
- Render d'un shell avec `Header`, sections metier, `BottomNav`.

2. `components/dashboard/*`:

- `DashboardStats`: affichage stats + empty state.
- `LearningActions`: actions review.

3. Shared:

- `SectionHeader` pour les titres de section.
- `StateMessage` pour les feedbacks inline.

### Exemple B: page words

1. `app/words/page.tsx`:

- Auth + langue active + fetch mots server.
- Render de `EncyclopediaClient`.

2. `components/encyclopedia/EncyclopediaClient.tsx`:

- Etat UI local (tags selectionnes).
- Memoisation filtrage/groupement.
- Delegation affichage vers `WordListItem`, `TagFilter`, `AlphabetNav`.

3. Shared interactions:

- Click/tap uniforme sur les items avec les utilitaires motion.

### Exemple C: flux review

1. `app/review/page.tsx`:

- Resolution des params URL (`lang`, simulation, fill), puis fetch due words.

2. `ReviewSessionContainer`:

- Machine d'etat de session (`pre`, `active`, `post`).
- Routage vers l'ecran adapte.

3. Screens review:

- Ecrans majoritairement presentationnels.
- Hauteur basee sur `100dvh` pour stabilite mobile.

## Checklist PR front

- [ ] Etat loading/empty/error couvre toute vue modifiee.
- [ ] Pas de logique metier lourde dans un composant visuel.
- [ ] Navigation conserve le contexte de route si attendu.
- [ ] Interactions utilisent les utilitaires motion partages.
- [ ] Verification mobile (viewport iPhone 15) avant merge.
