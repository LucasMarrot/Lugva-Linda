'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginFormSchema } from '@/lib/validation/schemas';

export async function login(formData: FormData) {
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

  revalidatePath('/', 'layout');
  redirect('/');
}
