import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { DailyTask, GrammarProgress, ReadingProgress, StudySession } from '@/models/Learning';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { User } from '@/models/User';
import { taipeiDayRange } from '@/lib/time';

type UserSettingsDoc={settings?:{dailyNewWordGoal?:number;dailyReviewGoal?:number}};
export async function GET(){
  const s=await auth();const userId=(s?.user as any)?.id;if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});await dbConnect();
  const user=await User.findById(userId).select('settings').lean() as UserSettingsDoc|null;const {key,start,end}=taipeiDayRange();const newTarget=user?.settings?.dailyNewWordGoal||10;const reviewTarget=user?.settings?.dailyReviewGoal||30;
  let task=await DailyTask.findOne({userId,dateKey:key});if(!task)task=await DailyTask.create({userId,dateKey:key,tasks:[{key:'new-words',target:newTarget,progress:0,completed:false},{key:'review',target:reviewTarget,progress:0,completed:false},{key:'grammar',target:1,progress:0,completed:false},{key:'reading',target:1,progress:0,completed:false},{key:'quiz',target:1,progress:0,completed:false}]});
  const [newWords,reviews,grammar,reading,quiz]=await Promise.all([VocabularyProgress.countDocuments({userId,firstSeenAt:{$gte:start,$lt:end}}),VocabularyProgress.countDocuments({userId,lastReviewedAt:{$gte:start,$lt:end}}),GrammarProgress.countDocuments({userId,lastStudiedAt:{$gte:start,$lt:end}}),ReadingProgress.countDocuments({userId,completedAt:{$gte:start,$lt:end}}),StudySession.countDocuments({userId,activity:'practice',startedAt:{$gte:start,$lt:end}})]);
  const targets:Record<string,number>={'new-words':newTarget,review:reviewTarget,grammar:1,reading:1,quiz:1};const progressMap:Record<string,number>={'new-words':newWords,review:reviews,grammar,reading,quiz};task.tasks.forEach((t:any)=>{t.target=targets[t.key]||t.target;t.progress=progressMap[t.key]||0;t.completed=t.progress>=t.target});await task.save();return NextResponse.json({dateKey:key,tasks:task.tasks});
}
