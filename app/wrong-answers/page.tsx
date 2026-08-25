import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { WrongAnswer } from '@/models/Learning';

export const dynamic = 'force-dynamic';

export default async function WrongAnswersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  await dbConnect();
  const userId = (session.user as any).id;
  const items: any[] = await WrongAnswer.find({ userId, understood: false })
    .sort({ lastWrongAt: -1 })
    .populate('questionId', 'type question options answer explanation optionExplanations')
    .limit(200).lean();

  return <main className="content">
    <h1>Wrong Answers</h1>
    <p className="muted">尚未標記為理解的錯題會保存在帳號中。</p>
    {items.length === 0 ? <div className="card"><h2>No unresolved wrong answers</h2><p>你目前沒有需要重新處理的錯題。</p></div> : <div className="list">{items.filter(item => item.questionId).map((item: any, index: number) => <details className="card" key={String(item._id)}><summary><strong>{index + 1}. {item.questionId.question}</strong> · {item.source}</summary>{item.questionId.options?.length ? <ol type="A">{item.questionId.options.map((option: string) => <li key={option}>{option}</li>)}</ol> : null}<p><strong>Answer:</strong> {String(item.questionId.answer)}</p><p>{item.questionId.explanation}</p><p className="muted">Wrong attempts: {item.attempts}</p></details>)}</div>}
  </main>;
}
