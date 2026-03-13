'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '../ConfirmButton';

type WordActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
};

const TIMEOUT_DURATION = 3000;

export const WordActions = ({ onEdit, onDelete }: WordActionsProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), TIMEOUT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  return (
    <div className="flex w-full items-center justify-center gap-3">
      <Button variant="outline" onClick={onEdit} className="flex-1 gap-2">
        <Edit2 className="h-4 w-4" /> Modifier
      </Button>

      <ConfirmButton
        onConfirm={onDelete}
        idleText="Supprimer"
        idleIcon={<Trash2 className="h-4 w-4" />}
        idleVariant="outlineDestructive"
        confirmVariant="destructive"
      />
    </div>
  );
};
