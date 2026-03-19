'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginFormSchema } from '@/lib/validation/schemas';
import { assertCsrfForAction } from '@/lib/security/csrf';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';

export async function login(formData: FormData) {
  const startedAt = Date.now();

  try {
    await assertCsrfForAction();

    const supabase = await createClient();

    const parsedForm = loginFormSchema.parse({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: parsedForm.email,
      password: parsedForm.password,
    });

    if (error) {
      redirect('/auth/login?error=true');
    }

    logActionSuccess('login', null, startedAt);
    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error) {
    logActionError('login', null, error, startedAt);
    throw toActionError(error);
  }
}
