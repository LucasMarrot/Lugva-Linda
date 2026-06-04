# Lugva Linda

Application web privée d'apprentissage du vocabulaire, pensée pour un petit groupe d'utilisateurs invités. Le produit combine une encyclopédie personnelle, une base partagée pour découvrir du vocabulaire, et des sessions de révision solo basées sur la répétition espacée (FSRS).

## Table des matières

- [Fonctionnalités](#fonctionnalites)
- [Pile technique](#pile-technique)
- [Démarrage rapide](#demarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données & Prisma](#base-de-donnees--prisma)
- [Scripts utiles](#scripts-utiles)
- [Structure du projet](#structure-du-projet)
- [Règles métier clés](#regles-metier-cles)
- [Roadmap](#roadmap)
- [Déploiement](#deploiement)
- [Sécurité et données sensibles](#securite-et-donnees-sensibles)
- [Contribuer](#contribuer)
- [Licence](#licence)

## Fonctionnalités

- Encyclopédie personnelle de mots, avec recherche et filtres par langue.
- Révision solo planifiée par FSRS, indépendante par type d'exercice.
- Notes, tags, synonymes et liens entre mots.
- Collaboration par copie de mots (lecture seule des mots des autres utilisateurs).
- UI sobre, basée sur shadcn/ui et Tailwind CSS.

## Pile technique

| Couche | Technologie |
| --- | --- |
| Frontend | Next.js (App Router) + React |
| UI | shadcn/ui + Tailwind CSS |
| Auth | Supabase Auth |
| Base | PostgreSQL + Prisma |
| Déploiement | Vercel |

## Démarrage rapide

Prérequis :

- Node.js 18+
- pnpm (ou npm / yarn)
- Une base PostgreSQL (Supabase recommandé)

```bash
# depuis la racine du dépôt
git clone <repo-url>
cd lugva-linda
pnpm install
# dupliquer l'exemple et remplir les valeurs sensibles
cp .env.example .env
# éditer .env et renseigner DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, etc.
pnpm dev
```

L'application sera disponible sur http://localhost:3000.

## Variables d'environnement

Les variables nécessaires sont listées dans [lugva-linda/.env.example](lugva-linda/.env.example). Remplissez `.env` localement sans jamais committer de valeurs secrètes.

Principales variables attendues :

- `DATABASE_URL`, `DIRECT_URL`, `MIGRATE_DATABASE_URL` (connexion PostgreSQL)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase)

Ne placez jamais les clefs de type `SERVICE_ROLE` ou autres secrets publics dans le dépôt.

## Base de données & Prisma

- Générer le client Prisma :

```bash
pnpm prisma generate
```

- Appliquer les migrations en local :

```bash
pnpm prisma migrate dev
```

Si vous utilisez Supabase, appliquez les migrations via leur interface SQL ou adaptez selon votre workflow.

## Scripts utiles

- `pnpm dev` — serveur de développement
- `pnpm build` — build de production (inclut `prisma generate`)
- `pnpm start` — lancer le build
- `pnpm lint` — exécuter ESLint
- `pnpm format` — formater le code (Prettier)
- `pnpm test` — tests Node
- `pnpm test:backend` — tests backend

## Structure du projet

```text
lugva-linda/
├── actions/          # Server actions
├── app/              # Routes App Router
├── components/       # UI et composants
├── data/             # Accès données côté serveur
├── hooks/            # Hooks React
├── lib/              # Services, auth, utils
├── prisma/           # Schema et migrations
├── public/           # Assets statiques
└── test/             # Tests Node
```

## Règles métier clés

- FSRS ne s'applique qu'aux révisions solo.
- Les battles/duels n'impactent pas la planification ni les statistiques FSRS.
- La progression est indépendante par type d'exercice.

## Déploiement

Le déploiement cible est Vercel. Avant de déployer, ajoutez les variables d'environnement nécessaires dans la configuration du projet Vercel (mêmes clés que dans `.env`).

## Sécurité et données sensibles

- Ne commitez jamais de fichier `.env` contenant des mots de passe ou clefs d'API.
- Si un secret a été committé, retirez-le du dépôt et réécrivez l'historique (BFG ou `git filter-repo`).

Exemple pour retirer un `.env` committé :

```bash
git rm --cached lugva-linda/.env
git commit -m "chore: remove local .env from repo"
git push origin main
```

Pour les clefs Supabase de type `SERVICE_ROLE`, traitez-les comme des secrets serveur et ne les exposez pas côté client.

## Contribuer

- Forkez le dépôt et créez une branche descriptive (`feature/` ou `fix/`).
- Respectez les règles de lint et formatez le code (`pnpm lint`, `pnpm format`).
- Ouvrez une Pull Request avec une description claire et des étapes de test.

## Licence

Projet sous licence MIT.
