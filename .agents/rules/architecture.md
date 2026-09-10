---
name: architecture
description: >
  Règles impératives d'architecture et de réutilisation des composants pour Lugva Linda.
  Chargé automatiquement avant toute implémentation de feature ou de composant.
---

# Règles d'Architecture — Lugva Linda

## Principe fondamental

**Avant d'écrire une seule ligne de code, effectue un audit de réutilisation.**
Toute création d'un nouveau composant ou utilitaire générique sans avoir vérifié l'existant est une violation.

---

## Inventaire des composants réutilisables

### Primitives Shadcn UI (`@/components/ui`)

> Importer depuis `@/components/ui` (barrel export), jamais directement depuis `radix-ui`.

| Composant | Import | Usage |
|---|---|---|
| `Button` | `@/components/ui` | Tout bouton interactif |
| `Input` | `@/components/ui` | Tout champ de saisie texte |
| `Label` | `@/components/ui` | Étiquettes de formulaire |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | `@/components/ui` | Conteneurs de données |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter` | `@/components/ui` | Modales desktop |
| `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter` | `@/components/ui` | Modales mobile (bottom sheet) |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | `@/components/ui` | Menus déroulants |
| `Popover`, `PopoverTrigger`, `PopoverContent` | `@/components/ui` | Popovers/tooltips |
| `Calendar` | `@/components/ui` | Sélecteur de date |
| `Badge` | `@/components/ui` | Tags, statuts, labels |
| `Separator` | `@/components/ui` | Dividers visuels |
| `Switch` | `@/components/ui` | Toggles booléens |
| `Spinner` | `@/components/ui` | Indicateurs de chargement |
| `Sonner` (via `sonner`) | `@/components/ui` | Toasts/notifications |

**⛔ Interdit : créer un composant `MyButton`, `CustomInput`, `Loader`, `Toast` ou tout autre élément déjà fourni ci-dessus.**

### Composants partagés applicatifs (`@/components/shared`)

| Composant | Usage |
|---|---|
| `PageHeader` | En-tête de page avec titre et actions |
| `SectionHeader` | En-tête de section secondaire |
| `StateMessage` | État vide, erreur ou information générique |
| `RouteErrorState` | Affichage d'erreur de route (error.tsx) |
| `ConfirmButton` | Bouton avec confirmation destructive |
| `WordListItem` | Élément de liste de mot dans l'encyclopédie |
| `WordTags` | Affichage et gestion des tags d'un mot |
| `AudioPlayer` | Lecteur audio pour les prononciations |
| `AudioRecorder` | Enregistreur audio (hook `useAudioRecorder`) |
| `ColorSelection` | Sélecteur de couleur utilisateur |
| `word-modal/WordDetailModal` | Modale de détail/édition d'un mot |
| `rich-text-editor/RichTextEditor` | Éditeur de notes (BlockNote) |
| `rich-text-editor/RichTextViewer` | Lecteur de notes (BlockNote) |
| `PictoLogo`, `TypoLogo` | Logos de la marque |
| `UnderConstructionPage` | Placeholder pour pages non implémentées |

### Hooks réutilisables (`@/hooks`)

| Hook | Usage |
|---|---|
| `useReviewSession` | Logique de session de révision FSRS |
| `useDuelGame` | Logique de jeu duel |
| `useCalendarData` | Données calendrier de révision |
| `useCommunityImport` | Import communautaire de mots |
| `useAudioRecorder` | Enregistrement audio |
| `useWordSnapshot` | Snapshot d'un mot pour comparaison |
| `useWordMutation` | Mutation optimiste des mots |
| `useUserColor` | Couleur thème de l'utilisateur |

### Providers React (`@/components/providers`)

| Provider | Contexte exposé |
|---|---|
| `ActiveLanguageProvider` | Langue active, liste de langues |
| `UserProvider` | Profil utilisateur courant |
| `WordModalProvider` | Ouverture/fermeture modale mot |
| `WordMutationProvider` | Mutations optimistes globales |
| `CommunityImportProvider` | État d'import communautaire |
| `PresenceProvider` | Présence Supabase temps réel |
| `ThemeProvider` | Thème clair/sombre |
| `ToastProvider` | Notifications toast |

### Utilitaires (`@/lib`)

| Utilitaire | Fichier | Usage |
|---|---|---|
| `cn()` | `@/lib/utils` | Fusion de classes Tailwind (obligatoire) |
| `frenchPluralize()` | `@/lib/utils` | Pluralisation FR |
| `formatConcept()` | `@/lib/utils` | Formatage terme + synonymes |
| `toUpperCaseFirstWord()` | `@/lib/utils` | Capitalisation |
| `toTint()` | `@/lib/utils` | Couleur transparente depuis hex |
| `normalizeText()` | `@/lib/words/normalization` | Normalisation unicode |
| `normalizeForLookup()` | `@/lib/words/normalization` | Normalisation recherche |
| Schemas Zod | `@/lib/validation/schemas` | Validation des formulaires |
| Erreurs typées | `@/lib/errors` | `AppError`, `ValidationError`, etc. |

### Couches infrastructure (`@/lib`) — ne pas recréer

| Couche | Fichier(s) | Fonctions clés |
|---|---|---|
| **Auth** | `@/lib/auth/server` | `requireAuthenticatedUser()`, `getCurrentUserProfile()`, `verifyWordOwnership()` |
| **Sécurité** | `@/lib/security/csrf`, `@/lib/security/rate-limit` | `assertCsrfForAction()`, `assertRateLimit()` |
| **Action Error** | `@/lib/actions/action-error` | `logActionSuccess()`, `logActionError()`, `toActionError()`, `mapActionError()` |
| **Observabilité** | `@/lib/observability/metrics` | `recordActionMetric()` — appelé indirectement via action-error |
| **Data RSC** | `@/data/` | Fonctions de lecture serveur pour les pages RSC (sans passer par Server Actions) |
| **Push** | `@/lib/push/push-service`, `@/lib/push/push-client` | Notifications Web Push (ne pas réimplémenter) |
| **Prisma** | `@/lib/prisma` | Client Prisma singleton (import default) |
| **Supabase** | `@/lib/supabase/server`, `@/lib/supabase/client` | Clients Supabase SSR |

**⛔ Interdit : créer un nouveau client Prisma, un nouveau gestionnaire d'erreurs, ou un nouveau système de logging.**

---

## Règles de structure

### Path aliases obligatoires
```typescript
// ✅ Correct
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useReviewSession } from '@/hooks/useReviewSession';

// ❌ Interdit
import { Button } from '../../components/ui/button';
import { cn } from '../../../lib/utils';
```

### Organisation des Server Actions
Cf. le skill `scaffold-server-action` et la rule `code-quality.md` pour le pattern complet 6 couches.
Référence : `requireAuthenticatedUser()` → CSRF → rate-limit → service → logging.

### Nouvelles features — checklist
Avant tout code :
- [ ] Le composant UI existe-t-il dans Shadcn ? → Réutiliser
- [ ] Le composant partagé existe-t-il dans `@/components/shared` ? → Réutiliser
- [ ] Le hook existe-t-il dans `@/hooks` ? → Réutiliser
- [ ] L'utilitaire existe-t-il dans `@/lib/utils` ? → Réutiliser
- [ ] Le schéma Zod existe-t-il ? → Étendre ou réutiliser
- [ ] Le service métier existe-t-il ? → Étendre, ne pas dupliquer

**Si un nouveau composant générique est nécessaire, il doit aller dans `@/components/shared` ou `@/components/ui`, jamais être défini inline dans une page ou une feature.**
