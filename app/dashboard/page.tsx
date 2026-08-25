import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { VocabularyProgress } from '@/models/VocabularyProgress';

export default async function Dashboard(){
  const session=await auth(); if(!session?.user) redirect('/login');
  await dbConnect();
  const userId=(session.user as any).id;
  const now=new Date();
  const [vocabCount,learned,mastered,due]=await Promise.all([
    Vocabulary.countDocuments({published:true}),
    VocabularyProgress.countDocuments({userId,reviewCount:{$gt:0}}),
    VocabularyProgress.countDocuments({userId,status:'mastered'}),
    VocabularyProgress.countDocuments({userId,nextReviewAt:{$lte:now}})
  ]);
  const hour=new Date().getHours(); const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  return <div className="shell"><aside className="sidebar"><div className="brand">Lexora</div><nav className="nav">{['Home','Vocabulary','Review','Grammar','Reading','Dictionary','Word Roots','Practice','Games','Exams','Wrong Answers','Progress'].map(x=><Link key={x} href={x==='Home'?'/dashboard':'/'+x.toLowerCase().replaceAll(' ','-')}>{x}</Link>)}</nav></aside><main className="content"><p className="muted">{greeting}</p><h1>{session.user.name}</h1><div className="grid"><div className="card"><div className="muted">正式詞彙資料</div><h2>{vocabCount.toLocaleString()}</h2><p>以資料庫實際 published 筆數計算</p></div><div className="card"><div className="muted">今日待複習</div><h2>{due}</h2></div><div className="card"><div className="muted">已掌握</div><h2>{mastered}</h2><p>已學習 {learned}</p></div></div></main></div>
}
