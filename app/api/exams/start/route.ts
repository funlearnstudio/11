import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Question, ExamRun } from '@/models/Learning';
import { Vocabulary } from '@/models/Vocabulary';
import { rateLimit } from '@/lib/security';

const maps:Record<string,string[]>={
  vocabulary:['en-zh','zh-en','definition','spelling','fill','context','cloze','sentence-completion'],
  grammar:['grammar','error-correction','sentence-completion'],
  reading:['reading','cloze'],
  listening:['listening']
};
const allowedTypes=new Set(['vocabulary','grammar','reading','listening','mixed','mock']);

export async function GET(req:Request){
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const rl=await rateLimit(req,'exam-start',20,60);if(!rl.allowed)return NextResponse.json({error:'Too many exam requests'},{status:429});
  const u=new URL(req.url);const rawType=u.searchParams.get('type')||'mixed';const type=allowedTypes.has(rawType)?rawType:'mixed';
  const requested=Math.max(5,Math.min(60,Number(u.searchParams.get('count'))||(type==='mock'?40:20)));
  const difficulty=Number(u.searchParams.get('difficulty')||0);const level=Number(u.searchParams.get('level')||0);
  await dbConnect();const match:any={published:true};
  if(type!=='mixed'&&type!=='mock')match.type={$in:maps[type]||[]};
  if(difficulty>=1&&difficulty<=5)match.difficulty=difficulty;
  if(level>=1&&level<=6){const vocabIds=await Vocabulary.find({published:true,ceecLevel:level}).distinct('_id');match.vocabularyIds={$in:vocabIds};}
  const available=await Question.countDocuments(match);if(!available)return NextResponse.json({error:'No published questions match these filters'},{status:409});
  const count=Math.min(requested,available);
  const questions:any[]=await Question.aggregate([{$match:match},{$sample:{size:count}},{$project:{question:1,options:1,type:1,difficulty:1,category:1}}]);
  const token=crypto.randomBytes(24).toString('hex');
  await ExamRun.create({token,userId,examType:type,questionIds:questions.map(q=>q._id),expiresAt:new Date(Date.now()+2*60*60*1000)});
  return NextResponse.json({runToken:token,questions,requested,available,count,type});
}
