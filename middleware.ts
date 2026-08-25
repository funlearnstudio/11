import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const protectedPrefixes = [
  '/dashboard', '/review', '/practice', '/games', '/exams', '/wrong-answers', '/progress', '/profile', '/settings', '/admin'
];

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!requiresAuth) return NextResponse.next();

  if (!request.auth?.user) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && (request.auth.user as { role?: string }).role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.svg|app-icon.svg).*)']
};
