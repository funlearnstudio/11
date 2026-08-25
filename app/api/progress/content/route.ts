import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { GrammarLesson, GrammarProgress, Article, ReadingProgress, StudySession } from '@/models/Learning';
import { awardXp } from '@/lib/gamification';
import { sameOrigin } from '@/lib/security';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
  const session=await auth();const userId=(session?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>({}));const kind=body.kind==='grammar'?'grammar':body.kind==='reading'?'reading':null;
  if(!kind||typeof body.id!=='string'||!Types.ObjectId.isValid(body.id))return NextResponse.json({error:'Invalid progress payload'},{status:400});
  await dbConnect();const now=new Date();const durationSeconds=Math.max(0,Math.min(4*60*60,Number(body.durationSeconds)||0));const correct=Math.max(0,Math.min(500,Number(body.correct)||0));const wrong=Math.max(0,Math.min(500,Number(body.wrong)||0));let completed=false;let newlyCompleted=false;
  if(kind==='grammar'){
    if(!await GrammarLesson.exists({_id:body.id,published:true}))return NextResponse.json({error:'Lesson not found'},{status:404});
    const existing:any=await GrammarProgress.findOne({userId,grammarId:body.id}).lean();const attempts=correct+wrong;const mastery=attempts?correct/attempts:body.completed?1:(existing?.mastery||0);newlyCompleted=!!body.completed&&!existing?.completedAt;
    const set:any={status:body.completed?'completed':'learning',mastery,lastStudiedAt:now};if(newlyCompleted)set.completedAt=now;
    const progress=await GrammarProgress.findOneAndUpdate({userId,grammarId:body.id},{$set:set,$inc:{attempts:attempts?1:0,correctCount:correct,wrongCount:wrong}},{upsert:true,new:true,setDefaultsOnInsert:true});completed=progress.status==='completed'||progress.status==='mastered';
  }else{
    if(!await Article.exists({_id:body.id,published:true}))return NextResponse.json({error:'Article not found'},{status:404});
    const existing:any=await ReadingProgress.findOne({userId,articleId:body.id}).lean();const attempts=correct+wrong;newlyCompleted=!!body.completed&&!existing?.completedAt;const set:any={accuracy:attempts?correct/attempts:(existing?.accuracy||0)};if(newlyCompleted)set.completedAt=now;
    const progress=await ReadingProgress.findOneAndUpdate({userId,articleId:body.id},{$setOnInsert:{startedAt:now},$set:set,$inc:{timeSpentSeconds:durationSeconds,questionAttempts:attempts,correctCount:correct,wrongCount:wrong}},{upsert:true,new:true,setDefaultsOnInsert:true});completed=!!progress.completedAt;
  }
  if(durationSeconds>0)await StudySession.create({userId,activity:kind,startedAt:new Date(now.getTime()-durationSeconds*1000),endedAt:now,durationSeconds,correctCount:correct,wrongCount:wrong,metadata:{contentId:body.id}});
  const gamification=newlyCompleted?await awardXp(userId,kind==='reading'?25:20):null;
  return NextResponse.json({ok:true,completed,newlyCompleted,xpEarned:gamification?.earned||0,totalXp:gamification?.xp});
}
