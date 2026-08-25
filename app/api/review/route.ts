import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { scheduleReview } from '@/lib/srs';
import { awardXp } from '@/lib/gamification';

export async function POST(req:Request){
  const session=await auth();const userId=(session?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {vocabularyId,rating,correct}=await req.json();if(!vocabularyId||!['again','hard','good','easy'].includes(rating))return NextResponse.json({error:'Invalid review payload'},{status:400});
  await dbConnect();const progress=await VocabularyProgress.findOneAndUpdate({userId,vocabularyId},{$setOnInsert:{firstSeenAt:new Date()}},{new:true,upsert:true,setDefaultsOnInsert:true});
  const next=scheduleReview({rating,ease:progress.ease,intervalDays:progress.intervalDays,reviewCount:progress.reviewCount});progress.lastReviewedAt=new Date();progress.nextReviewAt=next.nextReviewAt;progress.ease=next.ease;progress.intervalDays=next.intervalDays;progress.reviewCount+=1;
  if(correct){progress.correctCount+=1;progress.streak+=1}else{progress.wrongCount+=1;progress.streak=0}
  progress.mastery=Math.max(0,Math.min(100,Math.round((progress.correctCount/Math.max(1,progress.reviewCount))*70+Math.min(30,progress.intervalDays))));progress.status=progress.mastery>=85&&progress.intervalDays>=21?'mastered':progress.reviewCount>0?'reviewing':'learning';progress.recentPerformance=[...progress.recentPerformance.slice(-19),{correct:!!correct,rating,at:new Date()}];await progress.save();
  const xp=correct?(rating==='easy'?5:rating==='good'?4:3):1;const gamification=await awardXp(userId,xp);
  return NextResponse.json({nextReviewAt:progress.nextReviewAt,mastery:progress.mastery,status:progress.status,xpEarned:gamification?.earned||0,totalXp:gamification?.xp,level:gamification?.level,streak:gamification?.streak});
}
