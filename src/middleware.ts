import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

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

    // Vérification du rôle admin via le token de session
    if (req.auth?.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  // Rediriger les utilisateurs connectés loin des pages auth
  const authRoutes = ['/connexion', '/inscription'];
  if (authRoutes.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL('/mon-espace', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protéger ces routes
    '/mon-espace/:path*',
    '/admin/:path*',
    '/connexion',
    '/inscription',
  ],
};
