import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { GameResult } from '@/models/Learning';
import { awardXp } from '@/lib/gamification';

const allowedGames=new Set(['word-match','definition-match','speed-quiz','spelling-challenge','falling-words','sentence-builder','cloze-challenge','root-builder','vocabulary-battle','memory-cards']);
const shuffle=<T,>(items:T[])=>[...items].sort(()=>Math.random()-.5);
function options(answer:string,pool:string[]){return shuffle([answer,...shuffle(pool.filter(x=>x&&x!==answer)).slice(0,3)]).filter((x,i,a)=>a.indexOf(x)===i).slice(0,4)}

export async function GET(req:Request){
  const s=await auth();if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const raw=new URL(req.url).searchParams.get('mode')||'word-match';const mode=allowedGames.has(raw)?raw:'word-match';await dbConnect();
  const match:any={published:true,'zhTWDefinitions.0':{$exists:true},'englishDefinitions.0':{$exists:true}};
  if(mode==='sentence-builder'||mode==='cloze-challenge')match['examples.0']={$exists:true};
  if(mode==='root-builder')match['morphology.0']={$exists:true};
  const words:any[]=await Vocabulary.aggregate([{$match:match},{$sample:{size:40}},{$project:{word:1,zhTWDefinitions:1,englishDefinitions:1,examples:1,morphology:1}}]);
  if(words.length<4)return NextResponse.json({error:`Not enough verified data for ${mode}`},{status:409});
  if(mode==='memory-cards'){
    const pairs=words.slice(0,6).map(w=>({vocabularyId:String(w._id),word:w.word,meaning:w.zhTWDefinitions[0]}));
    return NextResponse.json({mode,pairs});
  }
  const wordPool=words.map(w=>w.word);const zhPool=words.map(w=>w.zhTWDefinitions?.[0]).filter(Boolean);
  const rounds=words.slice(0,10).map((w:any)=>{
    const id=String(w._id);const zh=w.zhTWDefinitions[0];const enDef=w.englishDefinitions[0];const example=w.examples?.[0];
    if(mode==='definition-match')return{vocabularyId:id,word:w.word,prompt:enDef,answer:w.word,options:options(w.word,wordPool)};
    if(mode==='speed-quiz')return{vocabularyId:id,word:w.word,prompt:w.word,answer:zh,options:options(zh,zhPool),timeLimit:7};
    if(mode==='spelling-challenge')return{vocabularyId:id,word:w.word,prompt:zh,answer:w.word,options:[],input:true,audioText:w.word};
    if(mode==='falling-words')return{vocabularyId:id,word:w.word,prompt:`選出符合「${zh}」的英文單字`,answer:w.word,options:options(w.word,wordPool),timeLimit:6};
    if(mode==='sentence-builder'){
      const sentence=String(example?.text||'').trim();const tokens=sentence.split(/\s+/).filter(Boolean);return{vocabularyId:id,word:w.word,prompt:example?.zhTW||`Build a sentence containing ${w.word}`,answer:sentence,options:shuffle(tokens),tokens:shuffle(tokens)};
    }
    if(mode==='cloze-challenge'){
      const sentence=String(example?.text||'');const blank=sentence.replace(new RegExp(`\\b${w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i'),'_____');return{vocabularyId:id,word:w.word,prompt:blank,answer:w.word,options:options(w.word,wordPool)};
    }
    if(mode==='root-builder'){
      const parts=(w.morphology||[]).map((p:any)=>`${p.form} (${p.type}${p.meaning?`: ${p.meaning}`:''})`).join(' + ');return{vocabularyId:id,word:w.word,prompt:parts,answer:w.word,options:options(w.word,wordPool),morphology:w.morphology};
    }
    if(mode==='vocabulary-battle')return{vocabularyId:id,word:w.word,prompt:w.word,answer:zh,options:options(zh,zhPool),lives:3};
    return{vocabularyId:id,word:w.word,prompt:w.word,answer:zh,options:options(zh,zhPool)};
  });
  return NextResponse.json({mode,rounds});
}

export async function POST(req:Request){
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const b=await req.json();const game=allowedGames.has(b.mode)?b.mode:'word-match';const correctCount=Math.max(0,Number(b.correct)||0);const wrongCount=Math.max(0,Number(b.wrong)||0);const total=Math.max(1,correctCount+wrongCount);const score=Math.max(0,Number(b.score)||0);const xpEarned=Math.min(250,Math.floor(score/20)+correctCount*2);
  await dbConnect();const result=await GameResult.create({userId,game,score,accuracy:correctCount/total,correctCount,wrongCount,vocabularyIds:Array.isArray(b.vocabularyIds)?b.vocabularyIds:[],xpEarned,durationSeconds:Math.max(0,Number(b.durationSeconds)||0),completedAt:new Date()});
  const gamification=await awardXp(userId,xpEarned);return NextResponse.json({id:String(result._id),xpEarned,totalXp:gamification?.xp||0,level:gamification?.level||1,streak:gamification?.streak||0});
}
