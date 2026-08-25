import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { GrammarProgress, ReadingProgress, ExamAttempt, Achievement } from '@/models/Learning';

export const dynamic='force-dynamic';
type ProfileUser={displayName?:string;createdAt?:Date|string;level?:number;xp?:number;streak?:number};

export default async function ProfilePage(){
  const s=await auth();if(!s?.user)redirect('/login');const id=(s.user as any).id;await dbConnect();
  const [u,learned,mastered,reading,grammar,exams,achievements]=await Promise.all([
    User.findById(id).lean() as Promise<ProfileUser|null>,VocabularyProgress.countDocuments({userId:id,reviewCount:{$gt:0}}),VocabularyProgress.countDocuments({userId:id,status:'mastered'}),ReadingProgress.countDocuments({userId:id,completedAt:{$exists:true}}),GrammarProgress.countDocuments({userId:id,status:{$in:['completed','mastered']}}),ExamAttempt.countDocuments({userId:id,completedAt:{$exists:true}}),Achievement.find({userId:id}).sort({unlockedAt:-1}).lean() as Promise<any[]>
  ]);
  return <main className="content"><h1>Profile</h1><div className="card"><h2>{u?.displayName||s.user.name}</h2><p className="muted">Joined {u?.createdAt?new Date(u.createdAt).toLocaleDateString('zh-TW'):''}</p><div className="grid"><div><strong>Level</strong><p>{u?.level||1}</p></div><div><strong>XP</strong><p>{u?.xp||0}</p></div><div><strong>Streak</strong><p>{u?.streak||0}</p></div><div><strong>Learned</strong><p>{learned}</p></div><div><strong>Mastered</strong><p>{mastered}</p></div><div><strong>Reading</strong><p>{reading}</p></div><div><strong>Grammar</strong><p>{grammar}</p></div><div><strong>Exams</strong><p>{exams}</p></div></div></div><section style={{marginTop:20}}><h2>Achievements</h2>{achievements.length?<div className="grid">{achievements.map(a=><div className="card" key={String(a._id)}><strong>{a.title}</strong><p>{a.description}</p><p className="muted">Unlocked {a.unlockedAt?new Date(a.unlockedAt).toLocaleDateString('zh-TW'):''}</p></div>)}</div>:<div className="card">完成學習活動後，真正達成條件的成就會出現在這裡。</div>}</section></main>;
}
