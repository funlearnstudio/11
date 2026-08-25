import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Question, WrongAnswer, StudySession } from '@/models/Learning';
import { awardXp } from '@/lib/gamification';

const allowedTypes=['en-zh','zh-en','definition','spelling','fill','context','cloze','grammar','reading','listening','sentence-completion','error-correction'];

export async function GET(req:Request){
  const s=await auth();if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const url=new URL(req.url);const type=url.searchParams.get('type')||'mixed';const count=Math.max(1,Math.min(30,Number(url.searchParams.get('count'))||10));await dbConnect();const match:any={published:true};if(type!=='mixed'&&allowedTypes.includes(type))match.type=type;
  const items=await Question.aggregate([{$match:match},{$sample:{size:count}},{$project:{question:1,options:1,type:1,difficulty:1,category:1}}]);if(!items.length)return NextResponse.json({error:'No verified published questions are available for this practice set.'},{status:409});return NextResponse.json({items});
}

export async function POST(req:Request){
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json();if(typeof body.questionId!=='string')return NextResponse.json({error:'Invalid answer payload'},{status:400});await dbConnect();const q:any=await Question.findOne({_id:body.questionId,published:true}).lean();if(!q)return NextResponse.json({error:'Question not found'},{status:404});
  const selected=String(body.answer??'').trim();const expected=String(q.answer??'').trim();const correct=selected.toLowerCase()===expected.toLowerCase();
  if(!correct)await WrongAnswer.findOneAndUpdate({userId,questionId:q._id},{$set:{source:q.type==='grammar'?'grammar':q.type==='reading'?'reading':q.type==='listening'?'listening':'vocabulary',selectedAnswer:selected,lastWrongAt:new Date(),understood:false},$inc:{attempts:1}},{upsert:true,new:true,setDefaultsOnInsert:true});
  const xp=correct?3:0;const gamification=xp?await awardXp(userId,xp):null;await StudySession.create({userId,activity:q.type==='listening'?'listening':'practice',startedAt:new Date(),endedAt:new Date(),durationSeconds:Math.max(0,Number(body.durationSeconds)||0),correctCount:correct?1:0,wrongCount:correct?0:1,metadata:{questionId:String(q._id),type:q.type}});
  return NextResponse.json({correct,answer:q.answer,explanation:q.explanation,optionExplanations:q.optionExplanations||[],xpEarned:xp,totalXp:gamification?.xp});
}
