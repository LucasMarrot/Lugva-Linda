# Frontend Refactor Plan

## Contexte

Objectif: refactor global du front en conservant le design actuel, avec une architecture plus maintenable et un delivery progressif.

Contraintes confirmees:

- Mobile first (cible principale: iPhone 15).
- UI simple basee sur shadcn + Tailwind.
- Changement visuel minimal (nettoyage, pas de refonte graphique).
- Breaking changes techniques autorises s'ils sont maitrises.
- Theme light/dark/system: a traiter plus tard (pas en phase 1).
- Ajout d'un composant "page en cours de developpement" pour les routes non implementees.
- Projet prive (faible volumetrie utilisateurs), donc accessibilite pragmatique.

## Objectifs mesurables

1. Eliminer les routes mortes depuis la navigation principale.
2. Uniformiser les patterns d'erreur, loading, empty state sur les parcours critiques.
3. Formaliser un mini design system documente et applique.
4. Reduire la complexite des composants en separant vue, logique UI et logique metier.
5. Stabiliser l'experience mobile sur iPhone 15 (navigation, drawer, recherche, review).

## Principes d'architecture

1. Server Components par defaut, Client Components uniquement pour l'interactif.
2. Composants UI atomiques dans `components/ui`, composants metier par domaine.
3. Logique metier hors composants visuels (actions/services/hooks dedies).
4. Aucune route liee dans l'UI sans page cible disponible.
5. Aucune alerte navigateur pour les erreurs metier (remplacer par feedback UI standardise).

## Structure cible (front)

```text
app/
	(routes)
components/
	ui/                # primitives shadcn
	shared/            # composants transverses (states, placeholders, feedback)
	dashboard/
	encyclopedia/
	review/
	search/
	auth/
hooks/
	use-*.ts           # logique UI locale et reutilisable
lib/
	ui/                # helpers presentation (formatting, mapping messages)
docs/
	frontend-refactor.md
```

## Backlog priorise

### P1 - Fondations critiques (a faire en premier)

- [x] Creer un composant shared `UnderConstructionPage` reutilisable.
- [x] Creer les routes manquantes (ex: stats/settings) avec ce composant.
- [x] Corriger la navigation pour garantir 0 lien mort.
- [x] Standardiser les titres de page et la hierarchie de heading (eviter les doubles H1).
- [x] Corriger `html lang` pour coller a la langue principale de l'interface.
- [x] Definir un standard unique de feedback erreur (inline + banner/toast).
- [x] Retirer les `alert(...)` dans les parcours critiques.
- [x] Documenter les conventions design system (tokens + usage des variants).

### P2 - Cohesion UX et maintenabilite

- [x] Uniformiser les etats `loading/empty/error/success` sur:
  - Dashboard
  - Words
  - Search/Create drawer
  - Review
  - Auth
- [x] Harmoniser les espacements et tailles de composants selon une echelle unique.
- [x] Supprimer les styles hardcodes non necessaires hors tokens.
- [x] Stabiliser la recherche (debounce robuste + eviter resultats obsoletes).
- [x] Clarifier les frontieres entre composants presentationnels et composants orchestrateurs.
- [x] Extraire les patterns repetes en composants shared (message bloc, section header, action footer).

### P3 - Durcissement et polish

- [ ] Uniformiser les micro-interactions (durees, easing, feedback de clic/tap).
- [ ] Audit mobile iPhone 15 sur les parcours critiques (login, dashboard, words, review).
- [ ] Nettoyer les incoherences de navigation secondaire.
- [ ] Finaliser la documentation de handoff front (conventions + exemples de composition).
- [ ] Preparer la phase theme switch (spec light/dark/system sans implementation immediate).

## Plan d'execution en 3 phases

## Phase 1 - Stabiliser la base (P1)

But: securiser la navigation et les standards globaux sans changer l'identite visuelle.

Livrables:

1. `UnderConstructionPage` + routes placeholders branchees.
2. Navigation fiabilisee (plus de 404 depuis l'UI).
3. Standard erreurs utilisateur applique aux composants majeurs.
4. Regles d'architecture et de design system ecrites.

Critere de sortie:

- Aucun lien principal ne mene a une page inexistante.
- Aucun `alert(...)` dans les flux utilisateur principaux.

## Phase 2 - Uniformiser l'experience (P2)

But: rendre les ecrans coherents et reduire la dette de composition.

Livrables:

1. Etats UI unifies sur les pages principales.
2. Components shared extraits pour les patterns repetitifs.
3. Ajustements spacing/typographie/variants sans changer le design global.
4. Recherche plus stable en conditions reelles de saisie.

Critere de sortie:

- Les memes types d'etats UI se comportent de la meme facon sur toutes les pages critiques.

## Phase 3 - Finaliser et preparer la suite (P3)

But: finaliser le polish technique et preparer la prochaine evolution (theming).

Livrables:

1. Audit mobile iPhone 15 complet et corrections.
2. Documentation finale de conventions front.
3. Spécification de la future phase theme switch.

Critere de sortie:

- Experience percue stable et homogene sur mobile cible.
- Base prete pour evoluer sans regression architecturale.

## Checklist PR Front (a appliquer sur chaque lot)

- [ ] Pas de lien mort introduit.
- [ ] Pas de logique metier lourde dans un composant purement visuel.
- [ ] Etats loading/empty/error traites pour chaque vue impactee.
- [ ] Messages d'erreur utilisateur explicites et coherents.
- [ ] Classes Tailwind lisibles et conformes aux conventions du design system.
- [ ] Verification mobile sur viewport cible avant merge.
- [ ] Impact documente dans ce fichier (section "Suivi").

## Conventions design system (phase 1)

### Tokens de base

- Couleurs semantiques via tokens Tailwind: `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `text-primary`, `text-destructive`.
- Surfaces: utiliser `bg-card` pour les blocs de contenu et eviter les couleurs hex hardcodees.
- Espacements: conserver les echelles `p-4`, `p-6`, `gap-2`, `gap-3`, `space-y-2`, `space-y-4`, `space-y-8`.
- Rayon/ombre: `rounded-lg` pour feedback, `rounded-2xl` pour cartes pleines pages, `shadow-sm` par defaut.

### Variants et feedback utilisateur

- `Button`: conserver les variants shadcn (`default`, `outline`, `secondary`, `ghost`, `destructive`) avant de creer un style custom.

- Feedback metier standardise via toasts (zone basse de l'ecran):
  - `error`: echec action utilisateur.
  - `info`: information contextuelle non bloquante.
  - `success`: confirmation d'action (si necessaire).
- Aucun `alert(...)` navigateur pour les erreurs metier.
- Emplacement prefere: toast bas d'ecran, non bloquant.

### Hierarchie des titres

- Une seule balise `h1` par page visible.
- Le branding global (ex: nom d'app) reste en texte non-heading dans le header.
- Les titres de sections internes utilisent `h2` puis `h3`.

## Suivi

### Lot 1

- Statut: termine
- Scope:
  - Placeholders routes `stats` et `settings` via composant shared `UnderConstructionPage`.
  - Correction heading dans le header (eviter double `h1`) et `html lang="fr"`.
  - Standard de feedback commun avec toasts bas d'ecran.
  - Suppression des `alert(...)` dans les parcours critiques identifies.
- Risques:
  - Les pages `stats` et `settings` restent des placeholders fonctionnels (pas de logique metier).
  - Le standard de feedback est applique aux flux critiques modifies, extension a generaliser en P2.
- Validation:
  - Navigation principale testee sans lien mort sur dashboard/bottom nav/header.
  - Recherche de code `alert(`: aucune occurrence restante dans le frontend applicatif.

### Lot 2

- Statut: termine
- Scope:
  - Creation du composant shared `StateMessage` pour unifier les blocs `loading/empty/error`.
  - Migration des feedbacks inline sur `LoginForm` et `EncyclopediaClient` vers le pattern shared.
  - Stabilisation de la recherche dans `SearchView` (anti-resultats obsoletes + erreur inline standardisee).
  - Ajout d'un composant shared `PageLoadingState` et branchement sur `loading.tsx` pour Dashboard, Words, Review et Auth/Login.
  - Harmonisation des empty states sur `Review` (`EmptySessionScreen`) et `DashboardStats` via `StateMessage`.
  - Suppression d'un style hardcode de fond sur login (`bg-zinc-*`) au profit du token `bg-background`.
  - Unification des etats d'erreur de page avec `RouteErrorState` + `error.tsx` sur Dashboard, Words, Review et Auth/Login.
  - Extraction du pattern de titre de section via le composant shared `SectionHeader` (Dashboard/Search).
  - Ajout d'un etat `isSubmitting` dans `CreateWordView` pour standardiser le feedback de chargement en creation/modification.
- Risques:
  - Le niveau de granularite des messages d'erreur metier peut encore etre affine par type d'action.
  - Un audit mobile complet iPhone 15 reste necessaire pour valider les micro-ajustements d'espacement.
- Validation:
  - Flux recherche verifie: changement de saisie rapide ne remonte plus de resultats obsoletes.
  - Flux auth/words: erreurs et etats vides affiches via le meme composant shared.
  - Etats `loading` verifies sur routes critiques via fichiers `loading.tsx` dedies.
  - Dashboard/review: affichage d'etats vides harmonises sans changement visuel majeur.
  - Etats `error` verifies sur routes critiques via fichiers `error.tsx` dedies.
  - Flux create/edit drawer: bouton de soumission bloque + libelle de progression pendant l'action.

### Lot 3

- Statut: a faire
- Scope:
- Risques:
- Validation:

## Definition of Done (refactor front)

1. Navigation principale totalement fiable (0 route morte).
2. Design system minimum documente et utilise sur les pages critiques.
3. Patterns d'etats UI homogenes sur dashboard/words/search/review/auth.
4. Architecture des composants simplifiee et plus evolutive.
5. Experience mobile first stable sur iPhone 15.
