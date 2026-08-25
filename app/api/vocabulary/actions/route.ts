import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { Favorite } from '@/models/Learning';

export async function GET(req:Request){
  const session=await auth();const userId=(session?.user as any)?.id;
  if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const vocabularyId=new URL(req.url).searchParams.get('vocabularyId');
  if(!vocabularyId||!Types.ObjectId.isValid(vocabularyId))return NextResponse.json({error:'Invalid vocabulary id'},{status:400});
  await dbConnect();
  const [progress,favorite]=await Promise.all([
    VocabularyProgress.findOne({userId,vocabularyId}).lean(),
    Favorite.exists({userId,itemType:'vocabulary',itemId:vocabularyId})
  ]);
  return NextResponse.json({favorite:!!favorite,status:(progress as any)?.status||'unseen',mastery:(progress as any)?.mastery||0,nextReviewAt:(progress as any)?.nextReviewAt||null});
}

export async function POST(req:Request){
  const session=await auth();const userId=(session?.user as any)?.id;
  if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json();
  if(typeof body.vocabularyId!=='string'||!Types.ObjectId.isValid(body.vocabularyId))return NextResponse.json({error:'Invalid vocabulary id'},{status:400});
  if(!['favorite','review','mastered'].includes(body.action))return NextResponse.json({error:'Invalid action'},{status:400});
  await dbConnect();
  if(!await Vocabulary.exists({_id:body.vocabularyId,published:true}))return NextResponse.json({error:'Vocabulary not found'},{status:404});
  if(body.action==='favorite'){
    const existing=await Favorite.findOne({userId,itemType:'vocabulary',itemId:body.vocabularyId});
    if(existing){await existing.deleteOne();return NextResponse.json({ok:true,favorite:false});}
    await Favorite.create({userId,itemType:'vocabulary',itemId:body.vocabularyId});
    return NextResponse.json({ok:true,favorite:true});
  }
  const now=new Date();
  const update=body.action==='mastered'?{
    $setOnInsert:{firstSeenAt:now},
    $set:{status:'mastered',mastery:100,lastReviewedAt:now,nextReviewAt:new Date(now.getTime()+30*86400000)},
    $max:{intervalDays:30}
  }:{
    $setOnInsert:{firstSeenAt:now},
    $set:{status:'learning',nextReviewAt:now}
  };
  const progress=await VocabularyProgress.findOneAndUpdate({userId,vocabularyId:body.vocabularyId},update,{upsert:true,new:true,setDefaultsOnInsert:true});
  return NextResponse.json({ok:true,status:progress.status,mastery:progress.mastery,nextReviewAt:progress.nextReviewAt});
}
