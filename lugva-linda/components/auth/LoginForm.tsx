'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { loginFormSchema } from '@/lib/validation/schemas';

type LoginFormProps = {
  hasError: boolean;
  action: (formData: FormData) => Promise<void>;
};

export const LoginForm = ({ hasError, action }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validation = useMemo(
    () => loginFormSchema.safeParse({ email, password }),
    [email, password],
  );

  const issues = validation.success ? [] : validation.error.issues;
  const emailError = issues.find((issue) => issue.path[0] === 'email')?.message;
  const passwordError = issues.find(
    (issue) => issue.path[0] === 'password',
  )?.message;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Lugva Linda
        </CardTitle>
        <CardDescription>
          Connectez-vous pour accéder à votre encyclopédie.
        </CardDescription>
      </CardHeader>

      <form action={action} noValidate>
        <CardContent className="space-y-4">
          {hasError && (
            <div className="text-destructive border-destructive/30 bg-destructive/10 rounded-md border p-2 text-sm font-medium">
              Email ou mot de passe incorrect.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="lucas@exemple.com"
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

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!validation.success}
          >
            Se connecter
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
