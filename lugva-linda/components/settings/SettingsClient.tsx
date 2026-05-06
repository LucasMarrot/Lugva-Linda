'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updateEmail,
  updatePassword,
  updateUserColor,
  updateUsername,
} from '@/actions/user-actions';
import {
  userColorSchema,
  userEmailSchema,
  userPasswordSchema,
  usernameSchema,
} from '@/lib/validation/schemas';
import { USER_COLOR_OPTIONS } from '@/lib/users/colors';
import { toDisplayName } from '@/lib/words/community';
import { cn } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from '@/components/ui';
import { ConfirmButton, StateMessage } from '@/components/shared';

const parseActionError = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    const message = error.message ?? fallback;
    const separatorIndex = message.indexOf(':');
    if (separatorIndex > 0) {
      return message.slice(separatorIndex + 1).trim() || fallback;
    }
    return message;
  }

  return fallback;
};

type SettingsClientProps = {
  profile: {
    id: string;
    email: string;
    username: string | null;
    colorHex: string;
  };
};

type StatusState = {
  tone: 'success' | 'error';
  message: string;
} | null;

export const SettingsClient = ({ profile }: SettingsClientProps) => {
  const router = useRouter();
  const signOutRef = useRef<HTMLFormElement | null>(null);

  const initialDisplayName = toDisplayName(
    profile.email,
    profile.id,
    profile.username,
  );
  const initialUsername = profile.username ?? initialDisplayName;

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(profile.colorHex);

  const [usernameBaseline, setUsernameBaseline] = useState(initialUsername);
  const [emailBaseline, setEmailBaseline] = useState(profile.email);
  const [colorBaseline, setColorBaseline] = useState(profile.colorHex);

  const [usernameStatus, setUsernameStatus] = useState<StatusState>(null);
  const [emailStatus, setEmailStatus] = useState<StatusState>(null);
  const [passwordStatus, setPasswordStatus] = useState<StatusState>(null);
  const [colorStatus, setColorStatus] = useState<StatusState>(null);

  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);

  const usernameValidation = useMemo(
    () => usernameSchema.safeParse(username),
    [username],
  );
  const usernameError = usernameValidation.success
    ? null
    : (usernameValidation.error.issues[0]?.message ??
      "Nom d'utilisateur invalide.");
  const isUsernameDirty = username.trim() !== usernameBaseline.trim();

  const emailValidation = useMemo(
    () => userEmailSchema.safeParse(email),
    [email],
  );
  const emailError = emailValidation.success
    ? null
    : (emailValidation.error.issues[0]?.message ?? 'Email invalide.');
  const isEmailDirty = email.trim() !== emailBaseline.trim();

  const passwordValidation = useMemo(
    () => userPasswordSchema.safeParse(password),
    [password],
  );
  const confirmValidation = useMemo(
    () => userPasswordSchema.safeParse(confirmPassword),
    [confirmPassword],
  );
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

  const colorValidation = useMemo(
    () => userColorSchema.safeParse(selectedColor),
    [selectedColor],
  );
  const colorError = colorValidation.success
    ? null
    : (colorValidation.error.issues[0]?.message ?? 'Couleur invalide.');
  const isColorDirty = selectedColor !== colorBaseline;

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

  const handleUpdatePassword = async (formData: FormData) => {
    if (
      !passwordValidation.success ||
      !confirmValidation.success ||
      passwordMismatch
    ) {
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordStatus(null);
      await updatePassword(formData);
      setPassword('');
      setConfirmPassword('');
      setPasswordStatus({
        tone: 'success',
        message: 'Mot de passe mis a jour.',
      });
    } catch (error) {
      setPasswordStatus({
        tone: 'error',
        message: parseActionError(
          error,
          'Impossible de mettre a jour le mot de passe.',
        ),
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateColor = async (formData: FormData) => {
    if (!colorValidation.success || !isColorDirty) return;

    try {
      setIsUpdatingColor(true);
      setColorStatus(null);
      await updateUserColor(formData);
      setColorBaseline(selectedColor);
      setColorStatus({
        tone: 'success',
        message: 'Couleur mise a jour.',
      });
      router.refresh();
    } catch (error) {
      setColorStatus({
        tone: 'error',
        message: parseActionError(
          error,
          'Impossible de mettre a jour la couleur.',
        ),
      });
    } finally {
      setIsUpdatingColor(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>
            Mettez a jour votre identite et vos informations de connexion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-border bg-muted/20 space-y-1 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Apercu
            </p>
            <p className="text-lg font-semibold">{initialDisplayName}</p>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>

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
                <p className="text-destructive text-sm font-medium">
                  {emailError}
                </p>
              )}
            </div>

            {emailStatus && (
              <StateMessage
                tone={emailStatus.tone}
                message={emailStatus.message}
              />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Choisissez un mot de passe solide pour proteger votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleUpdatePassword} noValidate className="space-y-4">
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
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
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

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !passwordValidation.success ||
                  !confirmValidation.success ||
                  passwordMismatch ||
                  isUpdatingPassword
                }
              >
                {isUpdatingPassword ? 'Mise a jour...' : 'Mettre a jour'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Couleur</CardTitle>
          <CardDescription>
            Choisissez une couleur lisible sur fond clair ou fonce.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="border-border h-12 w-12 rounded-lg border"
              style={{ backgroundColor: selectedColor }}
            />
            <div>
              <p className="text-sm font-semibold">Couleur actuelle</p>
              <p className="text-muted-foreground text-xs">{selectedColor}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {USER_COLOR_OPTIONS.map((color) => {
              const isActive = color === selectedColor;
              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`Choisir ${color}`}
                  className={cn(
                    'h-10 w-10 rounded-full border transition-shadow',
                    isActive
                      ? 'border-foreground ring-foreground/40 ring-2'
                      : 'border-border',
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setSelectedColor(color);
                    if (colorStatus) setColorStatus(null);
                  }}
                />
              );
            })}
          </div>

          {colorError && (
            <p className="text-destructive text-sm font-medium">{colorError}</p>
          )}

          {colorStatus && (
            <StateMessage
              tone={colorStatus.tone}
              message={colorStatus.message}
            />
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <form action={handleUpdateColor} className="w-full">
            <input type="hidden" name="colorHex" value={selectedColor} />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !colorValidation.success || !isColorDirty || isUpdatingColor
                }
              >
                {isUpdatingColor ? 'Mise a jour...' : 'Mettre a jour'}
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Fermez votre session en toute securite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={signOutRef}
            action="/auth/signout"
            method="post"
            className="flex justify-end"
          >
            <ConfirmButton
              type="button"
              idleText="Se deconnecter"
              confirmText="Confirmer"
              idleVariant="outlineDestructive"
              confirmVariant="destructive"
              onConfirm={() => signOutRef.current?.requestSubmit()}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
