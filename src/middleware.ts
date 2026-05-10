import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';

import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);

const protectedRoutes = ['/generate', '/history', '/billing', '/settings'];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!isProtectedRoute || request.auth) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.nextUrl);
  loginUrl.searchParams.set('callbackUrl', pathname);

  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
