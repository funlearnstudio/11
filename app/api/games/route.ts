import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { GameResult } from '@/models/Learning';
import { User } from '@/models/User';

const allowedGames = new Set(['word-match','definition-match','speed-quiz','spelling-challenge','falling-words','sentence-builder','cloze-challenge','root-builder','vocabulary-battle','memory-cards']);

type XpUser={xp?:number};

export async function GET(req:Request){
  const s=await auth();
  if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const mode=new URL(req.url).searchParams.get('mode')||'word-match';
  await dbConnect();
  const words=await Vocabulary.aggregate([
    {$match:{published:true,'zhTWDefinitions.0':{$exists:true},'englishDefinitions.0':{$exists:true}}},
    {$sample:{size:24}},
    {$project:{word:1,zhTWDefinitions:1,englishDefinitions:1,examples:1,morphology:1}}
  ]);
  if(words.length<4)return NextResponse.json({error:'Not enough verified vocabulary data'},{status:409});
  const rounds=words.slice(0,10).map((w:any,idx:number)=>{
    let prompt=w.word;
    let answer=w.zhTWDefinitions?.[0]||'';
    if(mode==='definition-match'){prompt=w.englishDefinitions?.[0]||w.word;answer=w.word;}
    if(mode==='spelling-challenge'){prompt=w.zhTWDefinitions?.[0]||'Listen and spell';answer=w.word;}
    const answerPool=mode==='definition-match'||mode==='spelling-challenge'
      ? words.filter((_:any,i:number)=>i!==idx).map((x:any)=>x.word)
      : words.filter((_:any,i:number)=>i!==idx).map((x:any)=>x.zhTWDefinitions?.[0]).filter(Boolean);
    const options=[answer,...answerPool.filter((x:string)=>x&&x!==answer).slice(0,3)].sort(()=>Math.random()-.5);
    return {vocabularyId:String(w._id),word:w.word,prompt,answer,options,example:w.examples?.[0]?.text||null,morphology:w.morphology||[]};
  });
  return NextResponse.json({mode,rounds});
}

export async function POST(req:Request){
  const s=await auth();
  const userId=(s?.user as any)?.id;
  if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const b=await req.json();
  const game=allowedGames.has(b.mode)?b.mode:'word-match';
  const correctCount=Math.max(0,Number(b.correct)||0);
  const wrongCount=Math.max(0,Number(b.wrong)||0);
  const total=Math.max(1,correctCount+wrongCount);
  const score=Math.max(0,Number(b.score)||0);
  const xpEarned=Math.min(200,Math.floor(score/20)+correctCount*2);
  await dbConnect();
  const result=await GameResult.create({userId,game,score,accuracy:correctCount/total,correctCount,wrongCount,vocabularyIds:Array.isArray(b.vocabularyIds)?b.vocabularyIds:[],xpEarned,durationSeconds:Math.max(0,Number(b.durationSeconds)||0),completedAt:new Date()});
  const user=await User.findByIdAndUpdate(userId,{$inc:{xp:xpEarned}},{new:true}).lean() as XpUser|null;
  return NextResponse.json({id:String(result._id),xpEarned,totalXp:user?.xp||0});
}
