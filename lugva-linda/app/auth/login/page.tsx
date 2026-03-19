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
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <LoginForm hasError={hasError} action={login} />
    </div>
  );
}
