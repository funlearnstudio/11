import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { StudySession } from '@/models/Learning';
import { sameOrigin } from '@/lib/security';

export async function GET(){const s=await auth();if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401});await dbConnect();const words=await Vocabulary.aggregate([{$match:{published:true,'zhTWDefinitions.0':{$exists:true}}},{$sample:{size:12}},{$project:{word:1,ipa:1,zhTWDefinitions:1,examples:1}}]);if(words.length<4)return NextResponse.json({error:'Not enough verified vocabulary for listening practice'},{status:409});return NextResponse.json({items:words.map((w:any)=>({id:String(w._id),word:w.word,ipa:w.ipa||'',meaning:w.zhTWDefinitions[0],example:w.examples?.[0]?.text||null}))});}
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});const b=await req.json().catch(()=>({}));const correct=Math.max(0,Math.min(100,Number(b.correct)||0));const wrong=Math.max(0,Math.min(100,Number(b.wrong)||0));const durationSeconds=Math.max(0,Math.min(2*60*60,Number(b.durationSeconds)||0));await dbConnect();await StudySession.create({userId,activity:'listening',startedAt:new Date(Date.now()-durationSeconds*1000),endedAt:new Date(),durationSeconds,correctCount:correct,wrongCount:wrong,metadata:{mode:typeof b.mode==='string'?b.mode.slice(0,40):'word'}});return NextResponse.json({ok:true});}
