import type { NextAuthConfig } from 'next-auth';

const protectedPrefixes = [
  '/dashboard', '/review', '/practice', '/games', '/exams', '/wrong-answers', '/progress', '/profile', '/settings', '/admin'
];

export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const protectedRoute = protectedPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
      if (!protectedRoute) return true;
      if (!auth?.user) return false;
      if (pathname.startsWith('/admin') && (auth.user as { role?: string }).role !== 'admin') return false;
      return true;
    }
  },
  providers: []
} satisfies NextAuthConfig;
