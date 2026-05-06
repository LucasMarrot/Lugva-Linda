'use client';

import { useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ConfirmButton, StateMessage } from '@/components/shared';
import { parseActionError, StatusState } from './parseActionError';
import { deleteAccountAction } from '@/actions/user-actions';
import { toast } from 'sonner';

export const DangerZoneSection = () => {
  const signOutRef = useRef<HTMLFormElement | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<StatusState>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setDeleteStatus(null);

      await deleteAccountAction();
    } catch (error) {
      setDeleteStatus({
        tone: 'error',
        message: parseActionError(error, 'Impossible de supprimer le compte.'),
      });
      toast.error('Erreur lors de la suppression du compte.');
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive">Zone de danger</CardTitle>
        <CardDescription>
          Actions critiques et irréversibles pour votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Déconnexion */}
        <div className="border-border bg-background flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-foreground font-semibold">Déconnexion</h4>
            <p className="text-muted-foreground mt-1 text-sm">
              Fermez votre session en toute sécurité sur cet appareil.
            </p>
          </div>
          <form ref={signOutRef} action="/auth/signout" method="post">
            <ConfirmButton
              type="button"
              idleText="Se déconnecter"
              confirmText="Confirmer"
              idleVariant="secondary"
              confirmVariant="outlineDestructive"
              onConfirm={() => signOutRef.current?.requestSubmit()}
            />
          </form>
        </div>

        {/* Suppression de compte */}
        <div className="border-destructive/20 bg-background flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-foreground font-semibold">
              Supprimer le compte
            </h4>
            <p className="text-muted-foreground mt-1 text-sm">
              Cette action supprimera définitivement vos données, votre
              progression et votre encyclopédie.
            </p>
          </div>
          <ConfirmButton
            type="button"
            idleText="Supprimer mon compte"
            confirmText="Je confirme la suppression définitive"
            idleVariant="outlineDestructive"
            confirmVariant="destructive"
            onConfirm={handleDeleteAccount}
            disabled={isDeleting}
          />
        </div>
        {deleteStatus && (
          <StateMessage
            tone={deleteStatus.tone}
            message={deleteStatus.message}
          />
        )}
      </CardContent>
    </Card>
  );
};
