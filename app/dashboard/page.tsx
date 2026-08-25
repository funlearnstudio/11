import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { GrammarProgress, ReadingProgress, ExamAttempt, GameResult, StudySession } from '@/models/Learning';
import { User } from '@/models/User';
import DailyTasks from '@/components/DailyTasks';

export const dynamic='force-dynamic';

export default async function Dashboard(){
  const session=await auth(); if(!session?.user)redirect('/login');
  await dbConnect();
  const userId=(session.user as any).id; const now=new Date();
  const [user,vocabCount,learned,mastered,due,grammar,reading,exams,games,study]=await Promise.all([
    User.findById(userId).select('xp level streak').lean(),
    Vocabulary.countDocuments({published:true}),
    VocabularyProgress.countDocuments({userId,reviewCount:{$gt:0}}),
    VocabularyProgress.countDocuments({userId,status:'mastered'}),
    VocabularyProgress.countDocuments({userId,nextReviewAt:{$lte:now}}),
    GrammarProgress.countDocuments({userId,status:{$in:['completed','mastered']}}),
    ReadingProgress.countDocuments({userId,completedAt:{$exists:true}}),
    ExamAttempt.countDocuments({userId,completedAt:{$exists:true}}),
    GameResult.countDocuments({userId}),
    StudySession.aggregate([{$match:{userId:(await import('mongoose')).Types.ObjectId.createFromHexString(userId)}},{$group:{_id:null,seconds:{$sum:'$durationSeconds'}}}])
  ]);
  const hour=new Date().getHours();const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  const nav=[['Home','/dashboard'],['Vocabulary','/vocabulary'],['Review','/review'],['Grammar','/grammar'],['Reading','/reading'],['Listening','/listening'],['Dictionary','/dictionary'],['Word Roots','/word-roots'],['Games','/games'],['Exams','/exams'],['Wrong Answers','/wrong-answers'],['Progress','/progress'],['Settings','/settings'],['Profile','/profile']] as const;
  return <div className="shell"><aside className="sidebar"><div className="brand">Lexora</div><nav className="nav">{nav.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav></aside><main className="content"><p className="muted">{greeting}</p><h1>{session.user.name}</h1><div className="grid"><div className="card"><div className="muted">Published vocabulary</div><h2>{vocabCount.toLocaleString()}</h2><p>database count</p></div><div className="card"><div className="muted">Due today</div><h2>{due}</h2></div><div className="card"><div className="muted">Mastered</div><h2>{mastered}</h2><p>Learned {learned}</p></div><div className="card"><div className="muted">XP / Level</div><h2>{user?.xp||0} XP</h2><p>Level {user?.level||1} · streak {user?.streak||0}</p></div><div className="card"><div className="muted">Completed</div><h2>{grammar+reading+exams+games}</h2><p>Grammar {grammar} · Reading {reading} · Exams {exams} · Games {games}</p></div><div className="card"><div className="muted">Study time</div><h2>{Math.round((study[0]?.seconds||0)/60)} min</h2></div></div><div style={{marginTop:16}}><DailyTasks/></div></main></div>;
}
