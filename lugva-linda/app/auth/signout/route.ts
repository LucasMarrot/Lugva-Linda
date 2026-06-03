import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { logActionError, logActionSuccess } from '@/lib/actions/action-error';
import { EmailOtpType } from '@supabase/supabase-js';

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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=Lien_invalide_ou_expire`,
  );
}
