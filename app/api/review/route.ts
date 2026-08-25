import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { Vocabulary } from '@/models/Vocabulary';
import { scheduleReview } from '@/lib/srs';
import { awardXp } from '@/lib/gamification';
import { sameOrigin } from '@/lib/security';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
  const session=await auth();const userId=(session?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>({}));const vocabularyId=body.vocabularyId;const rating=body.rating;
  if(typeof vocabularyId!=='string'||!Types.ObjectId.isValid(vocabularyId)||!['again','hard','good','easy'].includes(rating))return NextResponse.json({error:'Invalid review payload'},{status:400});
  await dbConnect();if(!await Vocabulary.exists({_id:vocabularyId,published:true}))return NextResponse.json({error:'Vocabulary not found'},{status:404});
  const now=new Date();const progress=await VocabularyProgress.findOneAndUpdate({userId,vocabularyId},{$setOnInsert:{firstSeenAt:now}},{new:true,upsert:true,setDefaultsOnInsert:true});
  const wasDue=!progress.nextReviewAt||progress.nextReviewAt<=now;
  const next=scheduleReview({rating,ease:progress.ease,intervalDays:progress.intervalDays,reviewCount:progress.reviewCount});const correct=rating!=='again';
  progress.lastReviewedAt=now;progress.nextReviewAt=next.nextReviewAt;progress.ease=next.ease;progress.intervalDays=next.intervalDays;progress.reviewCount+=1;
  if(correct){progress.correctCount+=1;progress.streak+=1}else{progress.wrongCount+=1;progress.streak=0;}
  progress.mastery=Math.max(0,Math.min(100,Math.round((progress.correctCount/Math.max(1,progress.reviewCount))*70+Math.min(30,progress.intervalDays))));progress.status=progress.mastery>=85&&progress.intervalDays>=21?'mastered':'reviewing';
  const recent=Array.isArray(progress.recentPerformance)?progress.recentPerformance:[];progress.recentPerformance=[...recent.slice(-19),{correct,rating,at:now}];await progress.save();
  const xp=wasDue?(correct?(rating==='easy'?5:rating==='good'?4:3):1):0;const gamification=xp?await awardXp(userId,xp):null;
  return NextResponse.json({nextReviewAt:progress.nextReviewAt,mastery:progress.mastery,status:progress.status,xpEarned:gamification?.earned||0,totalXp:gamification?.xp,level:gamification?.level,streak:gamification?.streak});
}
