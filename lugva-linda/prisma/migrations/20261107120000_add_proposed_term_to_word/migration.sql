-- AddColumn: proposedTerm on Word
-- Mot proposé par l'apprenant dans la langue cible (facultatif).
-- Le mot reste TO_COMPLETE tant que le contributeur ne l'a pas validé.
ALTER TABLE "Word" ADD COLUMN "proposedTerm" TEXT;
