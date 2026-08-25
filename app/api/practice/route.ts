import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Question, WrongAnswer, StudySession } from '@/models/Learning';
import { awardXp } from '@/lib/gamification';
import { sameOrigin } from '@/lib/security';
import { taipeiDayRange } from '@/lib/time';

const allowedTypes=['en-zh','zh-en','definition','spelling','fill','context','cloze','grammar','reading','listening','sentence-completion','error-correction'];
const norm=(v:unknown)=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase();

export async function GET(req:Request){
  const s=await auth();if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const url=new URL(req.url);const type=url.searchParams.get('type')||'mixed';const count=Math.max(1,Math.min(30,Number(url.searchParams.get('count'))||10));await dbConnect();const match:any={published:true};if(type!=='mixed'&&allowedTypes.includes(type))match.type=type;
  const items=await Question.aggregate([{$match:match},{$sample:{size:count}},{$project:{question:1,options:1,type:1,difficulty:1,category:1}}]);if(!items.length)return NextResponse.json({error:'No verified published questions are available for this practice set.'},{status:409});return NextResponse.json({items});
}

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>({}));if(typeof body.questionId!=='string'||!Types.ObjectId.isValid(body.questionId))return NextResponse.json({error:'Invalid answer payload'},{status:400});
  const selected=String(body.answer??'').trim().slice(0,2000);if(!selected)return NextResponse.json({error:'Answer is required'},{status:400});
  await dbConnect();const q:any=await Question.findOne({_id:body.questionId,published:true}).lean();if(!q)return NextResponse.json({error:'Question not found'},{status:404});
  const correct=norm(selected)===norm(q.answer);const source=q.type==='grammar'?'grammar':q.type==='reading'?'reading':q.type==='listening'?'listening':'vocabulary';
  if(!correct)await WrongAnswer.findOneAndUpdate({userId,questionId:q._id},{$set:{source,selectedAnswer:selected,lastWrongAt:new Date(),understood:false},$inc:{attempts:1}},{upsert:true,new:true,setDefaultsOnInsert:true});
  else await WrongAnswer.updateOne({userId,questionId:q._id},{$set:{understood:true}});
  const durationSeconds=Math.max(0,Math.min(3600,Number(body.durationSeconds)||0));const {start,end}=taipeiDayRange();
  const alreadyCorrect=await StudySession.exists({userId,activity:q.type==='listening'?'listening':'practice',startedAt:{$gte:start,$lt:end},'metadata.questionId':String(q._id),correctCount:{$gt:0}});
  const xp=correct&&!alreadyCorrect?3:0;const gamification=xp?await awardXp(userId,xp):null;
  await StudySession.create({userId,activity:q.type==='listening'?'listening':'practice',startedAt:new Date(Date.now()-durationSeconds*1000),endedAt:new Date(),durationSeconds,correctCount:correct?1:0,wrongCount:correct?0:1,metadata:{questionId:String(q._id),type:q.type}});
  return NextResponse.json({correct,answer:q.answer,explanation:q.explanation,optionExplanations:q.optionExplanations||[],xpEarned:xp,totalXp:gamification?.xp});
}
