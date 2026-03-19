import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { logActionError, logActionSuccess } from '@/lib/actions/action-error';

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    await assertSameOriginRequest();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.auth.signOut();
    }

    logActionSuccess('signout', user?.id ?? null, startedAt);
    revalidatePath('/', 'layout');
    return NextResponse.redirect(new URL('/auth/login', req.url), {
      status: 302,
    });
  } catch (error) {
    logActionError('signout', null, error, startedAt);
    return NextResponse.json(
      { error: 'SIGNOUT_FAILED' },
      {
        status: 403,
      },
    );
  }
}
