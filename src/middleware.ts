import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth.js v5 utilise le prefix "authjs" pour les cookies
  const token = await getToken({
    req,
    secret,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });
  const isLoggedIn = !!token;

  // Routes protégées : dashboard utilisateur
  const protectedRoutes = ['/mon-espace'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/connexion', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Routes admin
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/connexion', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  // Rediriger les utilisateurs connectés loin des pages auth
  const authRoutes = ['/connexion', '/inscription'];
  if (authRoutes.includes(pathname) && isLoggedIn) {
    const dest = token?.role === 'ADMIN' ? '/admin' : '/mon-espace';
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  const response = NextResponse.next();

  // ─── Headers de sécurité ───
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.).*)',
  ],
};
