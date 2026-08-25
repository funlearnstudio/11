import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Morphology } from '@/models/Morphology';

export const dynamic = 'force-dynamic';

export default async function WordRootsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = '' } = await searchParams;
  await dbConnect();
  const filter: any = { published: true };
  if (['prefix', 'root', 'suffix'].includes(type)) filter.type = type;
  const items: any[] = await Morphology.find(filter).select('slug form type meaningZhTW meaningEn origin').sort({ type: 1, form: 1 }).limit(300).lean();

  return <main className="content">
    <h1>Word Roots</h1>
    <p className="muted">Prefix / Root / Suffix Library，只顯示有來源與已發布的構詞分析。</p>
    <nav className="toolbar" aria-label="Morphology filters">
      <Link className="btn" href="/word-roots">All</Link>
      <Link className="btn" href="/word-roots?type=prefix">Prefixes</Link>
      <Link className="btn" href="/word-roots?type=root">Roots</Link>
      <Link className="btn" href="/word-roots?type=suffix">Suffixes</Link>
    </nav>
    {items.length === 0 ? <div className="card">目前沒有符合條件且已通過驗證的構詞資料。</div> : <div className="grid">{items.map(item => <Link className="card" href={`/word-roots/${item.slug}`} key={String(item._id)}><p className="muted">{item.type}</p><h2>{item.form}</h2><p>{item.meaningZhTW}</p><p className="muted">{item.meaningEn}</p></Link>)}</div>}
  </main>;
}
