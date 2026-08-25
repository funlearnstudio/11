import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { DailyTask, GrammarProgress, ReadingProgress, ExamAttempt } from '@/models/Learning';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { User } from '@/models/User';

function dateKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());}

type UserSettingsDoc={settings?:{dailyNewWordGoal?:number;dailyReviewGoal?:number}};

export async function GET(){
  const s=await auth();
  const userId=(s?.user as any)?.id;
  if(!userId)return NextResponse.json({error:'Unauthorized'},{status:401});
  await dbConnect();
  const user=await User.findById(userId).select('settings').lean() as UserSettingsDoc|null;
  const key=dateKey();
  let task=await DailyTask.findOne({userId,dateKey:key});
  if(!task){
    task=await DailyTask.create({userId,dateKey:key,tasks:[
      {key:'new-words',target:user?.settings?.dailyNewWordGoal||10,progress:0,completed:false},
      {key:'review',target:user?.settings?.dailyReviewGoal||30,progress:0,completed:false},
      {key:'grammar',target:1,progress:0,completed:false},
      {key:'reading',target:1,progress:0,completed:false},
      {key:'quiz',target:1,progress:0,completed:false}
    ]});
  }
  const start=new Date();start.setHours(0,0,0,0);
  const [newWords,reviews,grammar,reading,quiz]=await Promise.all([
    VocabularyProgress.countDocuments({userId,firstSeenAt:{$gte:start}}),
    VocabularyProgress.countDocuments({userId,lastReviewedAt:{$gte:start}}),
    GrammarProgress.countDocuments({userId,lastStudiedAt:{$gte:start}}),
    ReadingProgress.countDocuments({userId,completedAt:{$gte:start}}),
    ExamAttempt.countDocuments({userId,completedAt:{$gte:start}})
  ]);
  const progressMap:Record<string,number>={'new-words':newWords,review:reviews,grammar,reading,quiz};
  task.tasks.forEach((t:any)=>{t.progress=progressMap[t.key]||0;t.completed=t.progress>=t.target});
  await task.save();
  return NextResponse.json({dateKey:key,tasks:task.tasks});
}
