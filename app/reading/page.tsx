import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Article } from '@/models/Learning';

export const dynamic = 'force-dynamic';

export default async function ReadingPage({ searchParams }: { searchParams: Promise<{ category?: string; difficulty?: string }> }) {
  const query = await searchParams;
  await dbConnect();
  const filter: any = { published: true };
  if (query.category) filter.category = query.category;
  if (query.difficulty && /^[1-5]$/.test(query.difficulty)) filter.difficulty = Number(query.difficulty);
  const articles = await Article.find(filter)
    .select('slug title category difficulty estimatedReadingMinutes wordCount vocabularyCoverage')
    .sort({ createdAt: -1 }).limit(60).lean();

  return <main className="content">
    <h1>Reading</h1>
    <p className="muted">依難度、主題與已學字彙閱讀真正發布的文章。</p>
    <form className="toolbar">
      <input className="input" name="category" defaultValue={query.category || ''} placeholder="Category" aria-label="Reading category"/>
      <select className="select" name="difficulty" defaultValue={query.difficulty || ''} aria-label="Difficulty">
        <option value="">All difficulties</option>{[1,2,3,4,5].map(level => <option value={level} key={level}>Difficulty {level}</option>)}
      </select>
      <button className="btn" type="submit">Filter</button>
    </form>
    {articles.length === 0 ? <div className="card"><h2>目前沒有符合條件的已發布文章</h2><p>只會顯示已驗證並發布的正式閱讀內容。</p></div> :
      <div className="grid">{articles.map((article: any) => <Link className="card" href={`/reading/${article.slug}`} key={String(article._id)}>
        <p className="muted">{article.category} · Difficulty {article.difficulty}</p><h2>{article.title}</h2>
        <p>{article.estimatedReadingMinutes ? `${article.estimatedReadingMinutes} min` : 'Reading'}{article.wordCount ? ` · ${article.wordCount} words` : ''}</p>
      </Link>)}</div>}
  </main>;
}
