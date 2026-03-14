'use server';

import { requireAuthenticatedUser } from '@/lib/auth/server';
import prisma from '@/lib/prisma';
import { createLanguageFormSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function createLanguage(formData: FormData) {
  const user = await requireAuthenticatedUser();

  // Synchronisation utilisateur Supabase -> Prisma
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? `user-${user.id}@example.invalid`,
    },
  });

  const parsedForm = createLanguageFormSchema.parse({
    name: String(formData.get('name') ?? ''),
  });
  const name = parsedForm.name;

  const existingLanguage = await prisma.language.findFirst({
    where: {
      userId: user.id,
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (existingLanguage) {
    throw new Error(
      'La langue doit etre differente des langues deja existantes.',
    );
  }

  const code = name.substring(0, 2).toUpperCase();

  await prisma.language.create({
    data: {
      name,
      code,
      userId: user.id,
    },
  });

  revalidatePath('/');
}
