import { login } from './actions';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === 'true';

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <LoginForm hasError={hasError} action={login} />
    </div>
  );
}
