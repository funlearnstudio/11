import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Question, ExamAttempt } from '@/models/Learning';
import Link from 'next/link';

export default async function ExamsPage() {
  const session = await auth();
  await dbConnect();
  const [vocabulary, grammar, reading, mixed, attempts] = await Promise.all([
    Question.countDocuments({ published: true, type: { $in: ['en-zh','zh-en','definition','spelling','fill','context'] } }),
    Question.countDocuments({ published: true, type: 'grammar' }),
    Question.countDocuments({ published: true, type: 'reading' }),
    Question.countDocuments({ published: true }),
    ExamAttempt.countDocuments({ userId: (session?.user as any)?.id, completedAt: { $exists: true } })
  ]);
  const cards = [
    ['Vocabulary Exam', vocabulary, 'vocabulary'],
    ['Grammar Exam', grammar, 'grammar'],
    ['Reading Exam', reading, 'reading'],
    ['Mixed Exam', mixed, 'mixed']
  ] as const;
  return <main className="content"><h1>Exam Center</h1><p className="muted">題目全部從已發布題庫動態抽取；沒有足夠題目時不會生成假的考卷。</p><div className="grid">{cards.map(([name,count,type]) => <div className="card" key={type}><h2>{name}</h2><p>{count} published questions available</p>{count > 0 ? <Link className="btn primary" href={`/exams/start?type=${type}&count=${Math.min(20,count)}`}>開始考試</Link> : <span className="muted">尚無已驗證題目</span>}</div>)}</div><div className="card" style={{marginTop:16}}><strong>Completed exams:</strong> {attempts}</div></main>;
}
