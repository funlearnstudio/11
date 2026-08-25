import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Morphology } from '@/models/Morphology';

export const dynamic = 'force-dynamic';

export default async function MorphologyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await dbConnect();
  const item: any = await Morphology.findOne({ slug, published: true })
    .populate('relatedVocabularyIds', 'word ceecLevel definitionsZhTW')
    .lean();
  if (!item) notFound();

  return <main className="content">
    <p className="muted">{item.type}</p><h1>{item.form}</h1>
    <section className="card"><h2>Meaning</h2><p>{item.meaningZhTW}</p><p>{item.meaningEn}</p>{item.origin && <p className="muted">Origin: {item.origin}</p>}<p>{item.explanation}</p></section>
    {item.examples?.length > 0 && <section><h2>Word breakdown</h2><div className="list">{item.examples.map((example: any, index: number) => <div className="card" key={index}><strong>{example.word}</strong><p><code>{example.breakdown}</code></p><p>{example.meaningZhTW}</p></div>)}</div></section>}
    <section><h2>Related CEEC vocabulary</h2>{item.relatedVocabularyIds?.length ? <div className="list">{item.relatedVocabularyIds.map((word: any) => <Link className="wordrow" href={`/vocabulary/${encodeURIComponent(word.word)}`} key={String(word._id)}><strong>{word.word}</strong><span>Level {word.ceecLevel}</span><span>{word.definitionsZhTW?.[0] || ''}</span></Link>)}</div> : <p className="muted">目前尚未連結已驗證的 CEEC 詞彙。</p>}</section>
  </main>;
}
