'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { ConfirmButton } from '@/components/shared/';

type WordActionsProps = {
  canEdit?: boolean;
  canDelete?: boolean;
  canAdd?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  isAdding?: boolean;
};

const TIMEOUT_DURATION = 3000;

export const WordActions: FC<WordActionsProps> = ({
  canEdit = false,
  canDelete = false,
  canAdd = false,
  onEdit,
  onDelete,
  onAdd,
  isAdding = false,
}: WordActionsProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), TIMEOUT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  return (
    <div className="flex w-full items-center justify-center gap-3">
      {(canEdit || canDelete) && (
        <>
          {canEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1 gap-2"
              disabled={!onEdit}
            >
              <Edit2 className="h-4 w-4" /> Modifier
            </Button>
          )}

          {canDelete && (
            <ConfirmButton
              onConfirm={onDelete ?? (() => {})}
              idleText="Supprimer"
              idleIcon={<Trash2 className="h-4 w-4" />}
              idleVariant="outlineDestructive"
              confirmVariant="destructive"
            />
          )}
        </>
      )}

      {canAdd && (
        <Button onClick={onAdd} className="w-full gap-2" disabled={isAdding}>
          <Plus className="h-4 w-4" />
          {isAdding ? 'Ajout...' : 'Ajouter a mon encyclopedie'}
        </Button>
      )}
    </div>
  );
};
