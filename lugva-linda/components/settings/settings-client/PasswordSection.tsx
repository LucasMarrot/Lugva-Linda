'use client';

import { useMemo, useState } from 'react';
import { updatePassword } from '@/actions/user-actions';
import { userPasswordSchema } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui';
import { StateMessage } from '@/components/shared';
import { StatusState, parseActionError } from './parseActionError';

export const PasswordSection = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<StatusState>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const passwordValidation = useMemo(
    () => userPasswordSchema.safeParse(password),
    [password],
  );
  const confirmValidation = useMemo(
    () => userPasswordSchema.safeParse(confirmPassword),
    [confirmPassword],
  );

  const isOldPasswordFilled = oldPassword.trim().length > 0;

  const passwordError = passwordValidation.success
    ? null
    : (passwordValidation.error.issues[0]?.message ?? 'Mot de passe invalide.');
  const confirmError = confirmValidation.success
    ? null
    : (confirmValidation.error.issues[0]?.message ?? 'Confirmation invalide.');
  const passwordMismatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  const handleUpdatePassword = async (formData: FormData) => {
    if (
      !passwordValidation.success ||
      !confirmValidation.success ||
      passwordMismatch ||
      !isOldPasswordFilled
    ) {
      return;
    }
    try {
      setIsUpdatingPassword(true);
      setPasswordStatus(null);
      await updatePassword(formData);
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      setPasswordStatus({
        tone: 'success',
        message: 'Mot de passe mis à jour avec succès.',
      });
    } catch (error) {
      setPasswordStatus({
        tone: 'error',
        message: parseActionError(
          error,
          'Impossible de mettre à jour le mot de passe.',
        ),
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe</CardTitle>
        <CardDescription>
          Modifiez votre mot de passe en confirmant votre mot de passe actuel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleUpdatePassword} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Mot de passe actuel</Label>
            <Input
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(event) => {
                setOldPassword(event.target.value);
                if (passwordStatus) setPasswordStatus(null);
              }}
              required
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordStatus) setPasswordStatus(null);
              }}
              aria-invalid={!!passwordError}
              className={cn(
                'bg-background',
                passwordError &&
                  'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
              )}
              required
            />
            {passwordError && (
              <p className="text-destructive text-sm font-medium">
                {passwordError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirmer le nouveau mot de passe
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (passwordStatus) setPasswordStatus(null);
              }}
              aria-invalid={!!confirmError || passwordMismatch}
              className={cn(
                'bg-background',
                (confirmError || passwordMismatch) &&
                  'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
              )}
              required
            />
            {confirmError && (
              <p className="text-destructive text-sm font-medium">
                {confirmError}
              </p>
            )}
            {passwordMismatch && (
              <p className="text-destructive text-sm font-medium">
                Les mots de passe ne correspondent pas.
              </p>
            )}
          </div>

          {passwordStatus && (
            <StateMessage
              tone={passwordStatus.tone}
              message={passwordStatus.message}
            />
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={
                !isOldPasswordFilled ||
                !passwordValidation.success ||
                !confirmValidation.success ||
                passwordMismatch ||
                isUpdatingPassword
              }
            >
              {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
