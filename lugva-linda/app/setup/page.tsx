import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
import { createLanguage } from '@/actions/language-actions';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SetupLanguageForm } from '@/components/setup/SetupLanguageForm';

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const languageCount = await prisma.language.count({
    where: { userId: user.id },
  });

  if (languageCount > 0) redirect('/');

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="border-border w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-primary text-2xl">Bienvenue !</CardTitle>
          <CardDescription>
            Pour commencer, veuillez configurer la première langue que vous
            souhaitez apprendre.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <SetupLanguageForm action={createLanguage} />
        </div>
      </Card>
    </div>
  );
}
