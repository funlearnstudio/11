import type { NextAuthConfig } from 'next-auth';

const protectedPrefixes=['/dashboard','/review','/practice','/games','/exams','/wrong-answers','/progress','/profile','/settings','/admin','/listening'];
export const authConfig={
  secret:process.env.AUTH_SECRET,
  trustHost:true,
  pages:{signIn:'/login'},
  session:{strategy:'jwt' as const,maxAge:30*24*60*60},
  callbacks:{
    authorized({auth,request}){const pathname=request.nextUrl.pathname;const protectedRoute=protectedPrefixes.some(prefix=>pathname===prefix||pathname.startsWith(`${prefix}/`));if(!protectedRoute)return true;if(!auth?.user)return false;if(pathname.startsWith('/admin')&&(auth.user as {role?:string}).role!=='admin')return Response.redirect(new URL('/dashboard',request.nextUrl));return true},
    jwt({token,user}){if(user){token.id=String(user.id||'');token.role=(user as {role?:string}).role||'user'}return token},
    session({session,token}){if(session.user){(session.user as typeof session.user&{id?:string;role?:string}).id=typeof token.id==='string'?token.id:undefined;(session.user as typeof session.user&{id?:string;role?:string}).role=typeof token.role==='string'?token.role:undefined}return session}
  },
  providers:[]
} satisfies NextAuthConfig;
