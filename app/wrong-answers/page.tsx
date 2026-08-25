import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { WrongAnswer } from '@/models/Learning';
import WrongAnswerCard from '@/components/WrongAnswerCard';

export const dynamic='force-dynamic';

export default async function WrongAnswersPage(){
  const session=await auth();if(!session?.user)redirect('/login');
  await dbConnect();const userId=(session.user as any).id;
  const items:any[]=await WrongAnswer.find({userId,understood:false}).sort({lastWrongAt:-1}).populate('questionId','type question options answer explanation optionExplanations').limit(200).lean();
  const valid=items.filter(item=>item.questionId);
  return <main className="content"><h1>Wrong Answers</h1><p className="muted">錯題永久保存在帳號中，直到你重新答對或自行標記已理解。</p>{valid.length===0?<div className="card"><h2>No unresolved wrong answers</h2><p>你目前沒有需要重新處理的錯題。</p></div>:<div className="list">{valid.map((item:any,index:number)=><WrongAnswerCard key={String(item._id)} item={JSON.parse(JSON.stringify(item))} index={index}/>)}</div>}</main>;
}
