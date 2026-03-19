# Data Model V2 - Proposal and Migration Plan

## Why this V2

This proposal is aligned with these product constraints:

- Shared global languages for all users.
- User-owned words with read-only access to words owned by others.
- Copy-on-duplicate when importing someone else's word into your own encyclopedia.
- No duplicate term per user + language in active encyclopedia.
- Soft delete first, hard delete from trash later.
- FSRS with fixed grades (1-4), professional tracking and analytics.
- Keep Prisma-first simplicity while enforcing strong integrity.

## Main changes from current schema

1. Remove `Category` (business no longer needs it).
2. Keep `Language` global and add `createdBy` for audit and ownership context.
3. Add future-ready role `CONTRIBUTOR`.
4. Replace loose arrays for categorization and synonym relations:

- `Tag` + `WordTag` for robust filtering/statistics.
- `WordLink` for explicit synonym/related links.

5. Add duplication lineage with `Word.sourceWordId`.
6. Add soft delete lifecycle on `Word` and `Card`.
7. Add `customAudioPath` in addition to URL for reliable bucket deletion.
8. Add composite relation integrity on `Card -> Word` using `(wordId, ownerId, languageId)`.

## Constraints that make the schema safer

1. `@@unique([ownerId, languageId, termNormalized, isDeleted])` on `Word`:

- Prevents duplicates in active encyclopedia.
- Allows restoring logic with trash workflow.

2. Composite FK on `Card`:

- Prevents accidental cross-tenant card links.

3. Per-user per-language unique tags:

- `@@unique([ownerId, languageId, labelNormalized])`.

4. Indexes include deletion state where relevant:

- Better trash queries and active-only queries.

## Migration strategy (safe phases)

1. Alignment phase

- Freeze and decide canonical naming (`word` vs `term`, `userId` vs `ownerId`).
- Your code currently mixes old and new naming conventions; unify first.

2. Expand phase (non-breaking)

- Add new nullable fields and new tables (`Tag`, `WordTag`, `WordLink`, `sourceWordId`, `isDeleted`, `deletedAt`, `customAudioPath`).
- Keep existing fields for compatibility.

3. Backfill phase

- Convert existing `Word.tags` array to `Tag` + `WordTag`.
- Convert existing `synonyms` arrays to `WordLink` records where possible.
- Populate `customAudioPath` when derivable.

4. Switch phase

- Move read/write app code to new tables and soft-delete flow.
- Add storage cleanup logic on delete:
  - soft delete: keep file.
  - hard delete from trash: remove Supabase object by `customAudioPath` then delete row.

5. Cleanup phase

- Remove deprecated `Category` and legacy array fields if no longer used.
- Tighten constraints and unique indexes.

## Audio deletion rule

For your requirement "delete audio when word is deleted":

- Store storage object key (`customAudioPath`) at upload time.
- On hard delete, execute:
  - `supabase.storage.from('audio-files').remove([customAudioPath])`
  - then DB delete in transaction-like sequence with fallback logs.

## Future features already supported

1. Real-time battles:

- Keep this out of core word schema; use dedicated `BattleSession`, `BattleParticipant`, `BattleEvent` tables later.

2. Analytics page:

- Current `ReviewLog` indexes are enough for your scale.
- You can later add daily aggregate tables if needed.

3. Invitation-only onboarding:

- Add `Invitation` table when you are ready; current `invitedById` on `User` is a minimal start.

## Open decisions before implementation

1. Canonical field names:

- Option A: keep old (`word`, `userId`) for minimal code churn.
- Option B: move to explicit (`term`, `ownerId`) for cleaner long-term architecture.

2. Synonyms semantics:

- strict bidirectional synonyms or directional links only.

3. Trash policy:

- retention duration before hard delete (e.g. 30 days).
