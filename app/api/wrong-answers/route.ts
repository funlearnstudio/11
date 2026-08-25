import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { WrongAnswer, Question } from '@/models/Learning';
import { sameOrigin } from '@/lib/security';

const norm=(v:unknown)=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase();
export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});const session=await auth();const userId=(session?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});const body=await req.json().catch(()=>({}));if(typeof body.wrongAnswerId!=='string'||!Types.ObjectId.isValid(body.wrongAnswerId)||!['understood','retry'].includes(body.action))return NextResponse.json({error:'Invalid request'},{status:400});await dbConnect();const wrong:any=await WrongAnswer.findOne({_id:body.wrongAnswerId,userId});if(!wrong)return NextResponse.json({error:'Wrong answer entry not found'},{status:404});if(body.action==='understood'){wrong.understood=true;await wrong.save();return NextResponse.json({ok:true,understood:true});}
  const q:any=await Question.findOne({_id:wrong.questionId,published:true}).lean();if(!q)return NextResponse.json({error:'Question is no longer available'},{status:404});const selected=String(body.answer??'').trim().slice(0,2000);if(!selected)return NextResponse.json({error:'Answer is required'},{status:400});const correct=norm(selected)===norm(q.answer);if(correct){wrong.understood=true;await wrong.save();}else{wrong.selectedAnswer=selected;wrong.attempts=Math.max(0,Number(wrong.attempts)||0)+1;wrong.lastWrongAt=new Date();await wrong.save();}return NextResponse.json({correct,answer:q.answer,explanation:q.explanation,understood:!!wrong.understood});
}
