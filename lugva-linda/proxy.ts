import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/auth');

  // Les routes Cron internes ne sont jamais soumises
  // à l'authentification Supabase. Leur sécurité est assurée par le header
  // `Authorization: Bearer CRON_SECRET` vérifié dans chaque handler.
  const isCronRoute = pathname.startsWith('/api/cron/');
  if (isCronRoute) return NextResponse.next();

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * On applique le middleware sur toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (images optimisées)
     * - favicon.ico (icône)
     * - les fichiers dans public/ (images, fonts, audios, manifest, etc.)
     * - api/cron/* (routes Cron internes, protégées par CRON_SECRET)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|woff|woff2|ttf|mp3|wav|m4a|webm)$).*)',
  ],
};
