'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEmail, updateUsername } from '@/actions/user-actions';
import { usernameSchema, userEmailSchema } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils';
import { Button, Input, Label, Separator } from '@/components/ui';
import { StateMessage } from '@/components/shared';
import { parseActionError, StatusState } from './parseActionError';

type ProfileSectionProps = {
  initialUsername: string;
  initialEmail: string;
};

export const ProfileSection = ({
  initialUsername,
  initialEmail,
}: ProfileSectionProps) => {
  const router = useRouter();

  // --- Username State ---
  const [username, setUsername] = useState(initialUsername);
  const [usernameBaseline, setUsernameBaseline] = useState(initialUsername);
  const [usernameStatus, setUsernameStatus] = useState<StatusState>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const usernameValidation = useMemo(
    () => usernameSchema.safeParse(username),
    [username],
  );
  const usernameError = usernameValidation.success
    ? null
    : (usernameValidation.error.issues[0]?.message ??
      "Nom d'utilisateur invalide.");
  const isUsernameDirty = username.trim() !== usernameBaseline.trim();

  // --- Email State ---
  const [email, setEmail] = useState(initialEmail);
  const [emailBaseline, setEmailBaseline] = useState(initialEmail);
  const [emailStatus, setEmailStatus] = useState<StatusState>(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const emailValidation = useMemo(
    () => userEmailSchema.safeParse(email),
    [email],
  );
  const emailError = emailValidation.success
    ? null
    : (emailValidation.error.issues[0]?.message ?? 'Email invalide.');
  const isEmailDirty = email.trim() !== emailBaseline.trim();

  const handleUpdateUsername = async (formData: FormData) => {
    if (!usernameValidation.success || !isUsernameDirty) return;
    try {
      setIsUpdatingUsername(true);
      setUsernameStatus(null);
      await updateUsername(formData);
      setUsernameBaseline(username.trim());
      setUsernameStatus({
        tone: 'success',
        message: "Nom d'utilisateur mis a jour.",
      });
      router.refresh();
    } catch (error) {
      setUsernameStatus({
        tone: 'error',
        message: parseActionError(
          error,
          "Impossible de mettre a jour le nom d'utilisateur.",
        ),
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdateEmail = async (formData: FormData) => {
    if (!emailValidation.success || !isEmailDirty) return;
    try {
      setIsUpdatingEmail(true);
      setEmailStatus(null);
      await updateEmail(formData);
      setEmailBaseline(email.trim());
      setEmailStatus({
        tone: 'success',
        message: 'Email mis a jour. Verifiez votre boite de reception.',
      });
      router.refresh();
    } catch (error) {
      setEmailStatus({
        tone: 'error',
        message: parseActionError(
          error,
          "Impossible de mettre a jour l'email.",
        ),
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <>
      <form action={handleUpdateUsername} noValidate className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="username">{"Nom d'utilisateur"}</Label>
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (usernameStatus) setUsernameStatus(null);
            }}
            aria-invalid={!!usernameError}
            className={cn(
              usernameError &&
                'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
            )}
            required
          />
          <p className="text-muted-foreground text-xs">
            Affiche dans la communaute. Vous pouvez le personnaliser a tout
            moment.
          </p>
          {usernameError && (
            <p className="text-destructive text-sm font-medium">
              {usernameError}
            </p>
          )}
        </div>
        {usernameStatus && (
          <StateMessage
            tone={usernameStatus.tone}
            message={usernameStatus.message}
          />
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              !usernameValidation.success ||
              !isUsernameDirty ||
              isUpdatingUsername
            }
          >
            {isUpdatingUsername ? 'Mise a jour...' : 'Mettre a jour'}
          </Button>
        </div>
      </form>

      <Separator />

      <form action={handleUpdateEmail} noValidate className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailStatus) setEmailStatus(null);
            }}
            aria-invalid={!!emailError}
            className={cn(
              emailError &&
                'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
            )}
            required
          />
          {emailError && (
            <p className="text-destructive text-sm font-medium">{emailError}</p>
          )}
        </div>
        {emailStatus && (
          <StateMessage tone={emailStatus.tone} message={emailStatus.message} />
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              !emailValidation.success || !isEmailDirty || isUpdatingEmail
            }
          >
            {isUpdatingEmail ? 'Mise a jour...' : 'Mettre a jour'}
          </Button>
        </div>
      </form>
    </>
  );
};
