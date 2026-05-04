'use client';

import { useState } from 'react';
import { importWordFromCommunitySelectionAction } from '@/actions/word-actions';
import { parseActionErrorMessage } from '@/lib/actions/parse-action-error';
import { useToast } from '@/components/providers/ToastProvider';
import {
  PageHeader,
  PageLoadingState,
  StateMessage,
} from '@/components/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui';
import { CommunityImportPanels } from './CommunityImportPanels';
import { useCommunityImportPreview } from './useCommunityImportPreview';
import { useCommunityImportSelection } from './useCommunityImportSelection';

type CommunityImportModalProps = {
  sourceWordId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onImportingChange?: (wordId: string | null) => void;
  onImportSuccess?: () => void;
};

export const CommunityImportModal = ({
  sourceWordId,
  isOpen,
  onClose,
  onImportingChange,
  onImportSuccess,
}: CommunityImportModalProps) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { preview, isLoadingPreview, previewError, resetPreview } =
    useCommunityImportPreview({
      isOpen,
      sourceWordId,
    });
  const selection = useCommunityImportSelection(preview);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetPreview();
    onClose();
  };

  const handleConfirmImport = async () => {
    if (!preview || !sourceWordId) {
      return;
    }

    const payload = selection.buildPayload();
    if (!payload) {
      return;
    }

    try {
      setIsSubmitting(true);
      onImportingChange?.(sourceWordId);

      await importWordFromCommunitySelectionAction(sourceWordId, payload);
      toast.success('Mot ajoute à votre encyclopedie.');

      onImportingChange?.(null);
      onImportSuccess?.();
      handleClose();

      if (window.location.pathname === '/search') {
        window.location.assign('/search');
      }
    } catch (error) {
      onImportingChange?.(null);
      toast.error(parseActionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent fullScreen className="overflow-hidden">
        <DialogTitle>Importer un mot communautaire</DialogTitle>
        <DialogDescription>
          Comparez la version communautaire et votre version avant de confirmer
          l&apos;import.
        </DialogDescription>

        <div className="flex h-full flex-col">
          <PageHeader title="Import communautaire" onCancel={handleClose} />

          <div className="min-h-0 flex-1 overflow-hidden">
            {isLoadingPreview && (
              <PageLoadingState title="Chargement de la comparaison" />
            )}

            {!isLoadingPreview && previewError && (
              <StateMessage tone="error" message={previewError} />
            )}

            {!isLoadingPreview && preview && (
              <CommunityImportPanels preview={preview} selection={selection} />
            )}
          </div>

          <div className="border-border/70 bg-background/95 shrink-0 border-t p-4 backdrop-blur-sm">
            <Button
              className="w-full"
              onClick={handleConfirmImport}
              disabled={!preview || isLoadingPreview || isSubmitting}
            >
              {isSubmitting ? 'Import en cours...' : "Confirmer l'import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
