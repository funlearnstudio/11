import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { WrongAnswer, Question } from '@/models/Learning';

export async function POST(req:Request){
  const session=await auth();const userId=(session?.user as any)?.id;
  if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json();if(typeof body.wrongAnswerId!=='string'||!['understood','retry'].includes(body.action))return NextResponse.json({error:'Invalid request'},{status:400});
  await dbConnect();
  const wrong:any=await WrongAnswer.findOne({_id:body.wrongAnswerId,userId});
  if(!wrong)return NextResponse.json({error:'Wrong answer entry not found'},{status:404});
  if(body.action==='understood'){wrong.understood=true;await wrong.save();return NextResponse.json({ok:true,understood:true});}
  const q:any=await Question.findOne({_id:wrong.questionId,published:true}).lean();
  if(!q)return NextResponse.json({error:'Question is no longer available'},{status:404});
  const selected=String(body.answer??'').trim();if(!selected)return NextResponse.json({error:'Answer is required'},{status:400});
  const correct=selected.toLowerCase()===String(q.answer).trim().toLowerCase();
  if(correct){wrong.understood=true;await wrong.save();}else{wrong.selectedAnswer=selected;wrong.attempts+=1;wrong.lastWrongAt=new Date();await wrong.save();}
  return NextResponse.json({correct,answer:q.answer,explanation:q.explanation,understood:!!wrong.understood});
}
