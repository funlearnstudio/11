import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { authConfig } from '@/auth.config';

const credentialsSchema=z.object({email:z.string().trim().email(),password:z.string().min(8).max(128)});
type LeanUser={_id:unknown;displayName:string;email:string;passwordHash:string;role:'user'|'admin'};

export const {handlers,auth,signIn,signOut}=NextAuth({
  ...authConfig,
  providers:[Credentials({credentials:{email:{},password:{}},async authorize(raw){
    const parsed=credentialsSchema.safeParse(raw);if(!parsed.success)return null;await dbConnect();const email=parsed.data.email.toLowerCase();const user=await User.findOne({email}).lean() as LeanUser|null;if(!user)return null;const valid=await bcrypt.compare(parsed.data.password,user.passwordHash);if(!valid)return null;
    const configuredAdmin=process.env.ADMIN_EMAIL?.trim().toLowerCase();const role:LeanUser['role']=user.role==='admin'||configuredAdmin===email?'admin':'user';if(role==='admin'&&user.role!=='admin')await User.updateOne({_id:user._id},{$set:{role:'admin'}});
    return{id:String(user._id),name:user.displayName,email:user.email,role} as any;
  }})]
});
