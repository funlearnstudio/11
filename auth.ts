import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-lexora.session-token' : 'lexora.session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' }
    }
  },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      await dbConnect();
      const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).lean();
      if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
      return { id: String(user._id), name: user.displayName, email: user.email, role: user.role } as any;
    }
  })],
  callbacks: {
    jwt({ token, user }) { if (user) { token.id = user.id; token.role = (user as any).role; } return token; },
    session({ session, token }) { if (session.user) { (session.user as any).id = token.id; (session.user as any).role = token.role; } return session; }
  }
});
