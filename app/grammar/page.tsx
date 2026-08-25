import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { GrammarLesson } from '@/models/Learning';

export const dynamic = 'force-dynamic';

export default async function GrammarPage() {
  await dbConnect();
  const lessons = await GrammarLesson.find({ published: true })
    .select('slug title level zhExplanation')
    .sort({ level: 1, title: 1 })
    .lean();

  return <main className="content">
    <h1>Grammar Library</h1>
    <p className="muted">高中英文文法課程。內容只顯示已通過資料檢查並發布的單元。</p>
    {lessons.length === 0 ? <div className="card"><h2>內容整理中</h2><p>目前沒有已發布的文法單元。管理員匯入並驗證正式內容後會在這裡出現。</p></div> :
      <div className="list">{lessons.map((lesson: any) => <Link className="card" key={String(lesson._id)} href={`/grammar/${lesson.slug}`}>
        <strong>{lesson.title}</strong><div className="muted">{lesson.level}</div><p>{lesson.zhExplanation.slice(0, 160)}{lesson.zhExplanation.length > 160 ? '…' : ''}</p>
      </Link>)}</div>}
  </main>;
}
