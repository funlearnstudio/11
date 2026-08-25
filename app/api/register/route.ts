import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, sameOrigin } from '@/lib/security';

const schema=z.object({displayName:z.string().trim().min(2).max(60),email:z.string().trim().email(),password:z.string().min(8).max(128),confirmPassword:z.string().max(128)}).refine(v=>v.password===v.confirmPassword,{path:['confirmPassword'],message:'Passwords do not match'});
export async function POST(req:Request){
  try{if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});const rl=await rateLimit(req,'register',8,15*60);if(!rl.allowed)return NextResponse.json({error:'Too many registration attempts'},{status:429,headers:{'Retry-After':String(rl.retryAfterSeconds)}});const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Invalid registration data',details:parsed.error.issues},{status:400});const data=parsed.data;await dbConnect();const email=data.email.toLowerCase();if(await User.exists({email}))return NextResponse.json({error:'Email already registered'},{status:409});const passwordHash=await bcrypt.hash(data.password,12);const role=process.env.ADMIN_EMAIL?.trim().toLowerCase()===email?'admin':'user';try{const user=await User.create({displayName:data.displayName,email,passwordHash,role});return NextResponse.json({id:user.id,displayName:user.displayName,email:user.email},{status:201})}catch(error:any){if(error?.code===11000)return NextResponse.json({error:'Email already registered'},{status:409});throw error}}
  catch{ return NextResponse.json({error:'Registration failed'},{status:500}); }
}
