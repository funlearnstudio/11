import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { rateLimit, sameOrigin } from '@/lib/security';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
  const rl=await rateLimit(req,'forgot-password',6,15*60);
  if(!rl.allowed)return NextResponse.json({ok:true,message:'If the account exists, a reset email has been sent.'},{status:200});
  const body=await req.json().catch(()=>({}));const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  if(!email)return NextResponse.json({ok:true,message:'If the account exists, a reset email has been sent.'});
  await dbConnect();const user=await User.findOne({email});
  if(user){
    const token=crypto.randomBytes(32).toString('hex');
    user.resetTokenHash=crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpiresAt=new Date(Date.now()+60*60*1000);await user.save();
    const base=process.env.APP_URL||process.env.NEXTAUTH_URL;const key=process.env.RESEND_API_KEY;const from=process.env.RESET_EMAIL_FROM;
    if(base&&key&&from){
      try{await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[user.email],subject:'Reset your Lexora password',html:`<p>有人要求重設你的 Lexora 密碼。此連結一小時內有效。</p><p><a href="${base}/reset-password?token=${encodeURIComponent(token)}">Reset password</a></p><p>若不是你提出要求，請忽略這封信。</p>`})});}catch{ /* Keep response indistinguishable to prevent account enumeration. */ }
    }
  }
  return NextResponse.json({ok:true,message:'If the account exists, a reset email has been sent.'});
}
