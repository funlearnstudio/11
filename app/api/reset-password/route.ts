import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, sameOrigin } from '@/lib/security';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
  const rl=await rateLimit(req,'reset-password',10,15*60);
  if(!rl.allowed)return NextResponse.json({error:'Too many reset attempts'},{status:429,headers:{'Retry-After':String(rl.retryAfterSeconds)}});
  const body=await req.json().catch(()=>({}));const token=body.token;const password=body.password;
  if(typeof token!=='string'||typeof password!=='string'||password.length<8||password.length>128)return NextResponse.json({error:'Invalid reset request'},{status:400});
  await dbConnect();const hash=crypto.createHash('sha256').update(token).digest('hex');
  const user=await User.findOne({resetTokenHash:hash,resetTokenExpiresAt:{$gt:new Date()}});
  if(!user)return NextResponse.json({error:'Reset link is invalid or expired'},{status:400});
  user.passwordHash=await bcrypt.hash(password,12);user.resetTokenHash=undefined;user.resetTokenExpiresAt=undefined;await user.save();
  return NextResponse.json({ok:true});
}
