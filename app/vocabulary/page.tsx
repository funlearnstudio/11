import Link from 'next/link';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { VocabularyProgress } from '@/models/VocabularyProgress';
import { Favorite } from '@/models/Learning';

export const dynamic='force-dynamic';
function esc(v:string){return v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function queryString(sp:Record<string,string|undefined>,updates:Record<string,string|number|undefined>){const p=new URLSearchParams();for(const [k,v] of Object.entries({...sp,...updates}))if(v!==undefined&&v!=='')p.set(k,String(v));return `?${p.toString()}`}

export default async function VocabularyPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const sp=await searchParams;const session=await auth();const userId=(session?.user as any)?.id;await dbConnect();
  const page=Math.max(1,Number(sp.page||1));const limit=40;const filter:any={published:true};
  if(sp.level&&/^[1-6]$/.test(sp.level))filter.ceecLevel=Number(sp.level);
  if(sp.q)filter.$or=[{word:{$regex:esc(sp.q),$options:'i'}},{lemma:{$regex:esc(sp.q),$options:'i'}}];
  if(sp.pos)filter.partsOfSpeech=sp.pos;
  if(sp.morphology==='yes')filter['morphology.0']={$exists:true};
  if(sp.morphology==='no')filter['morphology.0']={$exists:false};
  if(userId&&sp.status){
    let ids:any[]=[];
    if(sp.status==='favorite')ids=(await Favorite.find({userId,itemType:'vocabulary'}).select('itemId').lean() as any[]).map(x=>x.itemId);
    else if(sp.status==='due')ids=(await VocabularyProgress.find({userId,nextReviewAt:{$lte:new Date()}}).select('vocabularyId').lean() as any[]).map(x=>x.vocabularyId);
    else if(['learning','reviewing','mastered'].includes(sp.status))ids=(await VocabularyProgress.find({userId,status:sp.status}).select('vocabularyId').lean() as any[]).map(x=>x.vocabularyId);
    else if(sp.status==='learned')ids=(await VocabularyProgress.find({userId,reviewCount:{$gt:0}}).select('vocabularyId').lean() as any[]).map(x=>x.vocabularyId);
    if(['favorite','due','learning','reviewing','mastered','learned'].includes(sp.status))filter._id={$in:ids};
  }
  const [items,total]=await Promise.all([Vocabulary.find(filter).sort({word:sp.sort==='za'?-1:1}).skip((page-1)*limit).limit(limit).lean(),Vocabulary.countDocuments(filter)]);
  const view=['list','compact','cards'].includes(sp.view||'')?sp.view:'list';
  return <main className="content"><div className="toolbar"><Link className="brand" href="/dashboard">Lexora</Link><span style={{flex:1}}/><span className="muted">{total.toLocaleString()} matching published entries</span></div><h1>Vocabulary</h1><form className="toolbar"><input className="input" name="q" placeholder="Search vocabulary" defaultValue={sp.q||''}/><select className="select" name="level" defaultValue={sp.level||''}><option value="">All levels</option>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>Level {n}</option>)}</select><select className="select" name="pos" defaultValue={sp.pos||''}><option value="">All POS</option>{['noun','verb','adjective','adverb','preposition','conjunction','pronoun','interjection'].map(x=><option key={x}>{x}</option>)}</select><select className="select" name="status" defaultValue={sp.status||''}><option value="">All learning states</option><option value="learned">Learned</option><option value="learning">Learning</option><option value="reviewing">Reviewing</option><option value="mastered">Mastered</option><option value="favorite">Favorites</option><option value="due">Due today</option></select><select className="select" name="morphology" defaultValue={sp.morphology||''}><option value="">Any morphology</option><option value="yes">Has root analysis</option><option value="no">No root analysis</option></select><select className="select" name="sort" defaultValue={sp.sort||'az'}><option value="az">A → Z</option><option value="za">Z → A</option></select><select className="select" name="view" defaultValue={view}><option value="list">List</option><option value="compact">Compact</option><option value="cards">Cards</option></select><button className="btn primary">Apply</button></form>{!session?.user&&sp.status?<div className="card">登入後才能使用個人學習狀態、收藏與到期複習篩選。</div>:null}<div className={view==='cards'?'grid':'list'}>{items.length?items.map((v:any)=><Link className={view==='cards'?'card':'wordrow'} key={String(v._id)} href={`/vocabulary/${encodeURIComponent(v.word)}`}><strong>{v.word}</strong><span>Level {v.ceecLevel}</span><span className="muted">{v.partsOfSpeech?.join(', ')}</span>{view==='cards'?<p>{v.zhTWDefinitions?.[0]}</p>:null}</Link>):<div className="card">沒有符合條件的正式詞彙資料。</div>}</div><div className="toolbar">{page>1&&<Link className="btn" href={queryString(sp,{page:page-1})}>Previous</Link>}<span className="muted">Page {page} / {Math.max(1,Math.ceil(total/limit))}</span>{page*limit<total&&<Link className="btn" href={queryString(sp,{page:page+1})}>Next</Link>}</div></main>;
}
