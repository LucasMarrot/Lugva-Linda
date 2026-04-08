-- This migration is intentionally idempotent because index names differ
-- depending on PostgreSQL name truncation and migration order in shadow DBs.

DROP INDEX IF EXISTS "User_activeLanguageId_idx";

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_class
		WHERE relkind = 'i'
			AND relname = 'Word_ownerId_languageId_isDeleted_termNormalized_mandatoryTag_i'
	) THEN
		ALTER INDEX "Word_ownerId_languageId_isDeleted_termNormalized_mandatoryTag_i"
			RENAME TO "Word_ownerId_languageId_isDeleted_termNormalized_mandatoryT_idx";
	END IF;
END
$$;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_class
		WHERE relkind = 'i'
			AND relname = 'Word_ownerId_languageId_termNormalized_mandatoryTag_deleteToken'
	) THEN
		ALTER INDEX "Word_ownerId_languageId_termNormalized_mandatoryTag_deleteToken"
			RENAME TO "Word_ownerId_languageId_termNormalized_mandatoryTag_deleteT_key";
	END IF;
END
$$;
