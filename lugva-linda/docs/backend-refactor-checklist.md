# Backend refactor checklist (secure and production-minded)

## Execution status

- 1. Migration and DB setup: fait (deja realise)
- 2. Prisma 7 config and environment hygiene: en cours (MIGRATE_DATABASE_URL bloque dans prisma.config.ts, parser Prisma limite)
- 3. Authorization and ownership model: fait
- 4. Data access architecture: fait
- 5. Word CRUD contract: fait
- 6. Duplicate prevention and trash behavior: fait
- 7. Supabase Storage hardening: fait
- 8. Error handling and API behavior: fait
- 9. Transactions and consistency: fait
- 10. Review/FSRS integrity: fait
- 11. Security controls: fait
- 12. Logging, monitoring, and audit: fait
- 13. Testing strategy: en cours
- 14. CI and quality gates: fait
- 15. Project-specific gaps identified in current codebase: en cours
- 16. Definition of done for this refactor: en cours

## 0) Priority order

1. First: data model and authorization consistency.
2. Second: error handling, validation, and storage safety.
3. Third: observability, tests, and CI enforcement.

## 1) Migration and DB setup

1. Keep one clean migration baseline in Prisma.
2. If `migrate reset` is blocked by network (P1001), apply SQL in Supabase SQL Editor.
3. Always regenerate Prisma client after schema change.
4. Add a minimal seed script with one admin user and one language.

Suggested commands:

- npm install
- npx prisma generate

Optional (if DB connectivity is OK):

- npx prisma migrate reset --force

## 2) Prisma 7 config and environment hygiene

1. Keep datasource URL in `prisma.config.ts` (not in `schema.prisma`).
2. Define a dedicated migration URL (`MIGRATE_DATABASE_URL`) separate from runtime URL when possible.
3. Fail fast at boot if required env vars are missing.
4. Document expected env vars in `.env.example`.

## 3) Authorization and ownership model

1. Every write action must enforce ownership with current schema fields (`ownerId`, `languageId`).
2. Replace all legacy checks using `userId` on `Word` or `Language`.
3. Global search can read all users words in a language, but editing is owner-only.
4. Server-side checks are mandatory even if UI is read-only.

## 4) Data access architecture

1. Create a service layer (`lib/services/*`) and keep server actions thin.
2. Centralize policy checks (`canReadWord`, `canEditWord`, `canDeleteWord`) to avoid drift.
3. Use DTOs/mappers to isolate Prisma models from UI payloads.
4. Keep one normalization utility shared by all write paths.

## 5) Word CRUD contract

Fields to handle in create/update:

- term
- termNormalized
- translation
- translationNormalized
- tags
- synonyms
- relatedWords
- notes
- customAudioPath
- customAudioUrl

Normalization rules:

1. Normalize `termNormalized` and `translationNormalized` (trim, lowercase, unicode normalize).
2. Normalize arrays (`tags`, `synonyms`, `relatedWords`): trim, dedupe, remove empty values.
3. Enforce max lengths in validation schema and at DB level where practical.

## 6) Duplicate prevention and trash behavior

1. Before create/update/restore, check active duplicate by `ownerId + languageId + termNormalized + deleteToken=0`.
2. Soft delete:

- `isDeleted=true`
- `deletedAt=now`
- `purgeAfter=now + retention`
- `deleteToken=unix timestamp ms`

3. Restore:

- block restore if active duplicate exists
- reset deletion fields and `deleteToken=0`

4. Hard delete:

- delete storage object first (if any)
- delete DB row second

## 7) Supabase Storage hardening

1. Persist and trust `customAudioPath` as source of truth for deletion.
2. Do not infer storage key from public URL.
3. Validate file MIME type and max size server-side.
4. Use deterministic path conventions (`audio-files/{ownerId}/{uuid}.{ext}`).
5. If storage deletion fails, do not delete DB row; return retryable error.

## 8) Error handling and API behavior

1. Replace generic `throw new Error(...)` with typed domain errors.
2. Add one central error mapper for server actions to return safe user messages.
3. Log internal details server-side only; never leak stack/infra details to client.
4. Use consistent error codes for frontend handling (`UNAUTHORIZED`, `FORBIDDEN`, `DUPLICATE`, etc.).

## 9) Transactions and consistency

1. Use `prisma.$transaction` when multiple writes must succeed/fail together.
2. In review flow, card update + review log insert must be atomic.
3. In duplicate flow, create word + optional derived records should be atomic.
4. Add idempotency strategy for user actions that can be retried.

## 10) Review/FSRS integrity

1. Query review queues from `Card` (not legacy `Word` fields).
2. Keep grade mapping fixed to `ReviewGrade` enum.
3. Validate all numeric FSRS outputs before persistence.
4. Preserve complete snapshot in `ReviewLog` for analytics.

## 11) Security controls

1. Add rate limiting on auth and mutation endpoints.
2. Add CSRF strategy for critical POST flows if needed by your architecture.
3. Validate all action inputs with Zod before DB/storage calls.
4. Minimize service-role usage and enforce least privilege.
5. Consider Postgres RLS as defense-in-depth even with server-side checks.

## 12) Logging, monitoring, and audit

1. Add structured logs with request ID, user ID, action, duration, result.
2. Log security-relevant events (failed auth, forbidden access attempts, deletion failures).
3. Add basic metrics: latency, error rate, storage error count.
4. Add alerting for repeated failures on DB or storage operations.

## 13) Testing strategy (minimum professional baseline)

1. Unit tests for normalization and validation.
2. Service tests for authorization policies.
3. Integration tests for create/update/delete/restore/hard-delete word lifecycle.
4. Integration tests for review transaction integrity.
5. Regression tests for legacy-field misuse (`userId`, `word`, old review schema).

## 14) CI and quality gates

1. CI must run typecheck, lint, tests, and Prisma schema validation.
2. Block merge on failing tests or migration drift.
3. Add command checks in CI:

- `npx prisma validate`
- `npx prisma generate`
- `npm run lint`

## 15) Project-specific gaps identified in current codebase

1. Legacy schema field usage remains in backend actions/auth (`userId`, `word`, old language ownership shape).
2. Review flow still reads/writes legacy review fields on `Word` instead of `Card` as source of truth.
3. Generic errors are still thrown in several write paths.
4. Audio lifecycle currently stores URL but needs path-first delete guarantees.
5. No dedicated service layer yet, which increases policy duplication risk.

## 16) Definition of done for this refactor

1. No legacy field references remain in backend code.
2. All mutating paths enforce ownership and typed validation.
3. Soft delete, restore, hard delete, and audio cleanup are fully covered by tests.
4. Review logic is fully card-centric and transaction-safe.
5. CI quality gates pass on every pull request.
