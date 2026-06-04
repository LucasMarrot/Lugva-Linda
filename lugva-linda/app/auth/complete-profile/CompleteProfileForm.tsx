'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui';
import { ColorSelection } from '@/components/shared/ColorSelection';
import { completeUserProfileAction } from '@/actions/user-actions';
import {
  usernameSchema,
  userPasswordSchema,
  userColorSchema,
} from '@/lib/validation/schemas';
import { DEFAULT_USER_COLOR, USER_COLOR_OPTIONS } from '@/lib/users/colors';

const completeProfileSchema = z.object({
  username: usernameSchema,
  password: userPasswordSchema,
  colorHex: userColorSchema,
});

type CompleteProfileFormProps = {
  unavailableColors: string[];
};

export const CompleteProfileForm = ({
  unavailableColors,
}: CompleteProfileFormProps) => {
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [colorHex, setColorHex] = useState<string>(() => {
    if (!unavailableColors.includes(DEFAULT_USER_COLOR))
      return DEFAULT_USER_COLOR;
    return (
      USER_COLOR_OPTIONS.find((c) => !unavailableColors.includes(c)) ||
      DEFAULT_USER_COLOR
    );
  });

  const validation = useMemo(
    () => completeProfileSchema.safeParse({ username, password, colorHex }),
    [username, password, colorHex],
  );

  const issues = validation.success ? [] : validation.error.issues;
  const usernameError = issues.find(
    (issue) => issue.path[0] === 'username',
  )?.message;
  const passwordError = issues.find(
    (issue) => issue.path[0] === 'password',
  )?.message;
  const colorError = issues.find(
    (issue) => issue.path[0] === 'colorHex',
  )?.message;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validation.success) return;

    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error: authError } = await supabase.auth.updateUser({
        password,
      });

      if (authError) throw authError;

      await completeUserProfileAction({ username, colorHex });

      toast.success('Compte configuré avec succès ! Bienvenue.');
      router.push('/');
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la création du compte.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Lugva Linda
          </CardTitle>
          <CardDescription>
            Finalisez la création de votre compte privé.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Pseudo</Label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Votre pseudo"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={!!usernameError}
                  disabled={isLoading}
                  className={cn(
                    'h-12 pl-10',
                    usernameError &&
                      'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
                  )}
                  required
                />
              </div>
              {usernameError && (
                <p className="text-destructive text-sm font-medium">
                  {usernameError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={!!passwordError}
                  disabled={isLoading}
                  className={cn(
                    'h-12 pl-10',
                    passwordError &&
                      'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
                  )}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-destructive text-sm font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorHex">Couleur de profil</Label>
              <ColorSelection
                value={colorHex}
                onChange={setColorHex}
                unavailableColors={unavailableColors}
              />
              {colorError && (
                <p className="text-destructive text-sm font-medium">
                  {colorError}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="mt-4 h-12 w-full text-base font-bold"
              disabled={!validation.success || isLoading}
            >
              {isLoading ? 'Configuration...' : "Terminer l'inscription"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
