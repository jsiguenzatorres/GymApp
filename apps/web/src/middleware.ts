import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];
const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'GYM_OWNER',
  'GYM_ADMIN',
  'TRAINER',
  'RECEPTIONIST',
  'NUTRITIONIST',
];

export default auth(
  (req: NextRequest & { auth: { user?: { role?: string }; error?: string } | null }) => {
    const { pathname } = req.nextUrl;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    // req.auth existe (la cookie decodifica) pero puede tener error='RefreshTokenExpired'
    // si el refresh automatico del access token fallo (ver auth.ts callback jwt()).
    // Antes esto dejaba pasar la request con un token invalido: las paginas
    // renderizaban "vacias" (0 miembros, listas en blanco) en vez de mandar al
    // usuario a re-loguearse, porque serverFetch() traga el 401 y retorna null.
    if (!req.auth || req.auth.error) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      if (req.auth?.error) loginUrl.searchParams.set('reason', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    const role = req.auth?.user?.role;
    if (pathname.startsWith('/dashboard') && role && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
