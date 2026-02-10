import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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
    return NextResponse.redirect(new URL('/mon-espace', req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/mon-espace/:path*',
    '/admin/:path*',
    '/connexion',
    '/inscription',
  ],
};
