import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { ExamAttempt,Question,WrongAnswer } from '@/models/Learning';
import { awardXp } from '@/lib/gamification';
import { sameOrigin } from '@/lib/security';

const norm=(v:unknown)=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase();

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json();const ids=Array.isArray(body.questionIds)?body.questionIds.filter((x:any)=>typeof x==='string'):[];if(!ids.length)return NextResponse.json({error:'No questions'},{status:400});
  await dbConnect();const found:any[]=await Question.find({_id:{$in:ids},published:true}).lean();const byId=new Map(found.map(q=>[String(q._id),q]));const qs=ids.map((id:string)=>byId.get(id)).filter(Boolean);
  const answerMap=body.answers&&typeof body.answers==='object'?body.answers:{};let correct=0;const review:any[]=[];const byType:Record<string,{correct:number;total:number}>={};const byDifficulty:Record<string,{correct:number;total:number}>={};const vocabularyToReview=new Set<string>();const grammarToReview=new Set<string>();
  for(const q of qs){
    const selected=answerMap[String(q._id)]??'';const ok=norm(selected)===norm(q.answer);if(ok)correct++;
    const t=q.type||'unknown';const d=String(q.difficulty||'unknown');byType[t]??={correct:0,total:0};byDifficulty[d]??={correct:0,total:0};byType[t].total++;byDifficulty[d].total++;if(ok){byType[t].correct++;byDifficulty[d].correct++}
    if(!ok){await WrongAnswer.findOneAndUpdate({userId,questionId:q._id},{$set:{source:q.type==='listening'?'listening':'exam',selectedAnswer:selected,lastWrongAt:new Date(),understood:false},$inc:{attempts:1}},{upsert:true,new:true});for(const id of q.vocabularyIds||[])vocabularyToReview.add(String(id));for(const id of q.grammarIds||[])grammarToReview.add(String(id))}
    review.push({questionId:String(q._id),question:q.question,options:q.options||[],answer:q.answer,selected,correct:ok,explanation:q.explanation,optionExplanations:q.optionExplanations||[],type:q.type,difficulty:q.difficulty});
  }
  const accuracy=Math.round(correct/Math.max(1,qs.length)*100);const score=accuracy;const flagged=Array.isArray(body.flaggedQuestionIds)?body.flaggedQuestionIds:[];const allowed=['vocabulary','grammar','reading','listening','mixed','mock'];const examType=allowed.includes(body.type)?body.type:'mixed';
  const attempt=await ExamAttempt.create({userId,examType,questionIds:qs.map(q=>q._id),answers:review.map(r=>({questionId:r.questionId,answer:r.selected,correct:r.correct})),score,accuracy,durationSeconds:Math.max(0,Number(body.durationSeconds)||0),flaggedQuestionIds:flagged,completedAt:new Date()});
  const xpEarned=Math.max(5,Math.round(correct*3+(accuracy>=80?15:0)));const gamification=await awardXp(userId,xpEarned);const serialize=(obj:Record<string,{correct:number;total:number}>)=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,{...v,accuracy:Math.round(v.correct/Math.max(1,v.total)*100)}]));
  return NextResponse.json({attemptId:String(attempt._id),score,accuracy,durationSeconds:attempt.durationSeconds,correct,total:qs.length,review,analysis:{byType:serialize(byType),byDifficulty:serialize(byDifficulty)},recommendations:{vocabularyIds:[...vocabularyToReview],grammarIds:[...grammarToReview]},xpEarned,level:gamification?.level||1,totalXp:gamification?.xp||0});
}
