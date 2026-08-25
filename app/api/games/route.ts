import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { GameResult,GameRun,StudySession } from '@/models/Learning';
import { awardXp } from '@/lib/gamification';
import { rateLimit,sameOrigin } from '@/lib/security';

const allowedGames=new Set(['word-match','definition-match','speed-quiz','spelling-challenge','falling-words','sentence-builder','cloze-challenge','root-builder','vocabulary-battle','memory-cards']);
const shuffle=<T,>(items:T[])=>[...items].sort(()=>Math.random()-.5);
function options(answer:string,pool:string[]){return shuffle([answer,...shuffle(pool.filter(x=>x&&x!==answer)).slice(0,3)]).filter((x,i,a)=>a.indexOf(x)===i).slice(0,4)}

export async function GET(req:Request){
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const limited=await rateLimit(req,'game-start',30,60);if(!limited.allowed)return NextResponse.json({error:'Too many game requests'},{status:429});
  const raw=new URL(req.url).searchParams.get('mode')||'word-match';const mode=allowedGames.has(raw)?raw:'word-match';await dbConnect();
  const match:any={published:true,'zhTWDefinitions.0':{$exists:true},'englishDefinitions.0':{$exists:true}};if(mode==='sentence-builder'||mode==='cloze-challenge')match['examples.0']={$exists:true};if(mode==='root-builder')match['morphology.0']={$exists:true};
  const words:any[]=await Vocabulary.aggregate([{$match:match},{$sample:{size:40}},{$project:{word:1,zhTWDefinitions:1,englishDefinitions:1,examples:1,morphology:1}}]);if(words.length<4)return NextResponse.json({error:`Not enough verified data for ${mode}`},{status:409});
  const selected=mode==='memory-cards'?words.slice(0,6):words.slice(0,10);const token=crypto.randomBytes(24).toString('hex');await GameRun.create({token,userId,game:mode,vocabularyIds:selected.map(w=>w._id),maxRounds:selected.length,expiresAt:new Date(Date.now()+60*60*1000)});
  if(mode==='memory-cards')return NextResponse.json({mode,runToken:token,pairs:selected.map(w=>({vocabularyId:String(w._id),word:w.word,meaning:w.zhTWDefinitions[0]}))});
  const wordPool=words.map(w=>w.word);const zhPool=words.map(w=>w.zhTWDefinitions?.[0]).filter(Boolean);
  const rounds=selected.map((w:any)=>{const id=String(w._id);const zh=w.zhTWDefinitions[0];const enDef=w.englishDefinitions[0];const example=w.examples?.[0];if(mode==='definition-match')return{vocabularyId:id,word:w.word,prompt:enDef,answer:w.word,options:options(w.word,wordPool)};if(mode==='speed-quiz')return{vocabularyId:id,word:w.word,prompt:w.word,answer:zh,options:options(zh,zhPool),timeLimit:7};if(mode==='spelling-challenge')return{vocabularyId:id,word:w.word,prompt:zh,answer:w.word,options:[],input:true,audioText:w.word};if(mode==='falling-words')return{vocabularyId:id,word:w.word,prompt:`選出符合「${zh}」的英文單字`,answer:w.word,options:options(w.word,wordPool),timeLimit:6};if(mode==='sentence-builder'){const sentence=String(example?.text||'').trim();const tokens=sentence.split(/\s+/).filter(Boolean);return{vocabularyId:id,word:w.word,prompt:example?.zhTW||`Build a sentence containing ${w.word}`,answer:sentence,options:shuffle(tokens),tokens:shuffle(tokens)}}if(mode==='cloze-challenge'){const sentence=String(example?.text||'');const blank=sentence.replace(new RegExp(`\\b${w.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i'),'_____');return{vocabularyId:id,word:w.word,prompt:blank,answer:w.word,options:options(w.word,wordPool)}}if(mode==='root-builder'){const parts=(w.morphology||[]).map((p:any)=>`${p.form} (${p.type}${p.meaning?`: ${p.meaning}`:''})`).join(' + ');return{vocabularyId:id,word:w.word,prompt:parts,answer:w.word,options:options(w.word,wordPool),morphology:w.morphology}}if(mode==='vocabulary-battle')return{vocabularyId:id,word:w.word,prompt:w.word,answer:zh,options:options(zh,zhPool),lives:3};return{vocabularyId:id,word:w.word,prompt:w.word,answer:zh,options:options(zh,zhPool)}});
  return NextResponse.json({mode,runToken:token,rounds});
}

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});const b=await req.json().catch(()=>({}));const token=typeof b.runToken==='string'?b.runToken:'';if(!token)return NextResponse.json({error:'Invalid game run'},{status:400});await dbConnect();
  const run:any=await GameRun.findOneAndUpdate({token,userId,usedAt:{$exists:false},expiresAt:{$gt:new Date()}},{$set:{usedAt:new Date()}},{new:true});if(!run)return NextResponse.json({error:'Game run is invalid, expired, or already submitted'},{status:409});
  const maxRounds=Math.max(1,Number(run.maxRounds)||1);const correctCount=Math.max(0,Math.min(maxRounds,Number(b.correct)||0));const wrongCount=Math.max(0,Math.min(maxRounds,Number(b.wrong)||0));const total=Math.max(1,Math.min(maxRounds,correctCount+wrongCount));const maxScore=maxRounds*250;const score=Math.max(0,Math.min(maxScore,Number(b.score)||0));const xpEarned=Math.min(150,Math.floor(score/50)+correctCount*2);const durationSeconds=Math.max(0,Math.min(2*60*60,Number(b.durationSeconds)||0));
  const result=await GameResult.create({userId,game:run.game,score,accuracy:correctCount/total,correctCount,wrongCount,vocabularyIds:run.vocabularyIds||[],xpEarned,durationSeconds,completedAt:new Date()});await StudySession.create({userId,activity:'game',startedAt:new Date(Date.now()-durationSeconds*1000),endedAt:new Date(),durationSeconds,correctCount,wrongCount,metadata:{game:run.game,resultId:String(result._id)}});const gamification=await awardXp(userId,xpEarned);return NextResponse.json({id:String(result._id),xpEarned,totalXp:gamification?.xp||0,level:gamification?.level||1,streak:gamification?.streak||0});
}
