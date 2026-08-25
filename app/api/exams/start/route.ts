import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Question } from '@/models/Learning';
import { Vocabulary } from '@/models/Vocabulary';

const maps:Record<string,string[]>={
  vocabulary:['en-zh','zh-en','definition','spelling','fill','context','cloze','sentence-completion'],
  grammar:['grammar','error-correction','sentence-completion'],
  reading:['reading','cloze'],
  listening:['listening']
};

export async function GET(req:Request){
  const s=await auth();if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const u=new URL(req.url);const type=u.searchParams.get('type')||'mixed';const requested=Math.max(5,Math.min(60,Number(u.searchParams.get('count'))|| (type==='mock'?40:20)));const difficulty=Number(u.searchParams.get('difficulty')||0);const level=Number(u.searchParams.get('level')||0);
  await dbConnect();const match:any={published:true};
  if(type!=='mixed'&&type!=='mock')match.type={$in:maps[type]||[]};
  if(difficulty>=1&&difficulty<=5)match.difficulty=difficulty;
  if(level>=1&&level<=6){const vocabIds=await Vocabulary.find({published:true,ceecLevel:level}).distinct('_id');match.vocabularyIds={$in:vocabIds}}
  const available=await Question.countDocuments(match);if(!available)return NextResponse.json({error:'No published questions match these filters'},{status:409});
  const count=Math.min(requested,available);
  const questions=await Question.aggregate([{$match:match},{$sample:{size:count}},{$project:{question:1,options:1,type:1,difficulty:1,category:1}}]);
  return NextResponse.json({questions,requested,available,count,type});
}
