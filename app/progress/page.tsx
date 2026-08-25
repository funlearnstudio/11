import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { GrammarProgress, ReadingProgress, ExamAttempt, StudySession, GameResult } from '@/models/Learning';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = (session.user as any).id;
  await dbConnect();

  const [learned, mastered, grammarCompleted, readingCompleted, exams, games, studyAgg] = await Promise.all([
    VocabularyProgress.countDocuments({ userId, status: { $ne: 'unseen' } }),
    VocabularyProgress.countDocuments({ userId, status: 'mastered' }),
    GrammarProgress.countDocuments({ userId, status: { $in: ['completed','mastered'] } }),
    ReadingProgress.countDocuments({ userId, completedAt: { $ne: null } }),
    ExamAttempt.countDocuments({ userId, completedAt: { $ne: null } }),
    GameResult.countDocuments({ userId }),
    StudySession.aggregate([{ $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } }, { $group: { _id: null, seconds: { $sum: '$durationSeconds' }, correct: { $sum: '$correctCount' }, wrong: { $sum: '$wrongCount' } } }])
  ]);

  const study = studyAgg[0] || { seconds: 0, correct: 0, wrong: 0 };
  const totalAnswers = study.correct + study.wrong;
  const accuracy = totalAnswers ? Math.round((study.correct / totalAnswers) * 100) : 0;

  return <main className="content">
    <h1>Progress</h1>
    <p className="muted">所有統計直接由你的學習紀錄計算，不使用預設假數字。</p>
    <div className="grid">
      <div className="card"><div className="muted">Learned vocabulary</div><h2>{learned}</h2></div>
      <div className="card"><div className="muted">Mastered vocabulary</div><h2>{mastered}</h2></div>
      <div className="card"><div className="muted">Grammar completed</div><h2>{grammarCompleted}</h2></div>
      <div className="card"><div className="muted">Reading completed</div><h2>{readingCompleted}</h2></div>
      <div className="card"><div className="muted">Exams completed</div><h2>{exams}</h2></div>
      <div className="card"><div className="muted">Games completed</div><h2>{games}</h2></div>
      <div className="card"><div className="muted">Study time</div><h2>{Math.round(study.seconds / 60)} min</h2></div>
      <div className="card"><div className="muted">Recorded accuracy</div><h2>{accuracy}%</h2></div>
    </div>
  </main>;
}
