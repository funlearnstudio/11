import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { GrammarLesson, GrammarProgress, Article, ReadingProgress, StudySession } from '@/models/Learning';
import { User } from '@/models/User';

export async function POST(req:Request){
  const session=await auth();
  const userId=(session?.user as any)?.id;
  if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json();
  const kind=body.kind==='grammar'?'grammar':body.kind==='reading'?'reading':null;
  if(!kind||typeof body.id!=='string')return NextResponse.json({error:'Invalid progress payload'},{status:400});
  await dbConnect();
  const now=new Date();
  const durationSeconds=Math.max(0,Math.min(4*60*60,Number(body.durationSeconds)||0));
  let completed=false;
  if(kind==='grammar'){
    const exists=await GrammarLesson.exists({_id:body.id,published:true});
    if(!exists)return NextResponse.json({error:'Lesson not found'},{status:404});
    const correct=Math.max(0,Number(body.correct)||0),wrong=Math.max(0,Number(body.wrong)||0),attempts=correct+wrong;
    const mastery=attempts?correct/attempts:body.completed?1:0;
    const progress=await GrammarProgress.findOneAndUpdate({userId,grammarId:body.id},{$set:{status:body.completed?'completed':'learning',mastery,lastStudiedAt:now,...(body.completed?{completedAt:now}:{})},$inc:{attempts:attempts?1:0,correctCount:correct,wrongCount:wrong}},{upsert:true,new:true,setDefaultsOnInsert:true});
    completed=progress.status==='completed'||progress.status==='mastered';
  } else {
    const exists=await Article.exists({_id:body.id,published:true});
    if(!exists)return NextResponse.json({error:'Article not found'},{status:404});
    const correct=Math.max(0,Number(body.correct)||0),wrong=Math.max(0,Number(body.wrong)||0),attempts=correct+wrong;
    const progress=await ReadingProgress.findOneAndUpdate({userId,articleId:body.id},{$setOnInsert:{startedAt:now},$set:{...(body.completed?{completedAt:now}:{}),accuracy:attempts?correct/attempts:0},$inc:{timeSpentSeconds:durationSeconds,questionAttempts:attempts,correctCount:correct,wrongCount:wrong}},{upsert:true,new:true,setDefaultsOnInsert:true});
    completed=!!progress.completedAt;
  }
  if(durationSeconds>0)await StudySession.create({userId,activity:kind,startedAt:new Date(now.getTime()-durationSeconds*1000),endedAt:now,durationSeconds,correctCount:Math.max(0,Number(body.correct)||0),wrongCount:Math.max(0,Number(body.wrong)||0),metadata:{contentId:body.id}});
  if(body.completed){const xp=kind==='reading'?25:20;await User.findByIdAndUpdate(userId,{$inc:{xp}});}
  return NextResponse.json({ok:true,completed});
}
