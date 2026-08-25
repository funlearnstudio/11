import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';

export const dynamic='force-dynamic';
export default async function VocabularyPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const sp=await searchParams; await dbConnect(); const page=Math.max(1,Number(sp.page||1)); const limit=40; const filter:any={published:true};
  if(sp.level&&/^[1-6]$/.test(sp.level)) filter.ceecLevel=Number(sp.level);
  if(sp.q) filter.word={$regex:sp.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
  const [items,total]=await Promise.all([Vocabulary.find(filter).sort({word:1}).skip((page-1)*limit).limit(limit).lean(),Vocabulary.countDocuments(filter)]);
  return <main className="content"><div className="toolbar"><Link className="brand" href="/dashboard">Lexora</Link><span style={{flex:1}}/><span className="muted">{total.toLocaleString()} published entries</span></div><h1>Vocabulary</h1><form className="toolbar"><input className="input" name="q" placeholder="Search vocabulary" defaultValue={sp.q||''}/><select className="select" name="level" defaultValue={sp.level||''}><option value="">All levels</option>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>Level {n}</option>)}</select><button className="btn">Filter</button></form><div className="list">{items.length?items.map((v:any)=><Link className="wordrow" key={String(v._id)} href={`/vocabulary/${encodeURIComponent(v.word)}`}><strong>{v.word}</strong><span>Level {v.ceecLevel}</span><span className="muted">{v.partsOfSpeech?.join(', ')}</span></Link>):<div className="card">沒有符合條件的正式詞彙資料。</div>}</div><div className="toolbar">{page>1&&<Link className="btn" href={`?page=${page-1}${sp.level?`&level=${sp.level}`:''}`}>Previous</Link>}<span className="muted">Page {page} / {Math.max(1,Math.ceil(total/limit))}</span>{page*limit<total&&<Link className="btn" href={`?page=${page+1}${sp.level?`&level=${sp.level}`:''}`}>Next</Link>}</div></main>
}
