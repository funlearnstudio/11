import Link from 'next/link';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import WordBuilder from '@/components/WordBuilder';

export const dynamic='force-dynamic';
function escapeRegExp(v:string){return v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

export default async function WordBuilderPage({searchParams}:{searchParams:Promise<{q?:string}>}){
  const {q=''}=await searchParams;const term=q.trim();await dbConnect();
  const exact:any=term?await Vocabulary.findOne({published:true,word:new RegExp(`^${escapeRegExp(term)}$`,'i')}).select('word morphology morphologyExplanation').lean():null;
  const suggestions:any[]=await Vocabulary.find({published:true,'morphology.0':{$exists:true},...(term?{word:new RegExp(escapeRegExp(term),'i')}:{})}).select('word ceecLevel morphology').sort({word:1}).limit(30).lean();
  return <main className="content"><p className="muted">Word Roots · Interactive analysis</p><h1>Word Builder</h1><p>只使用 Vocabulary 資料庫中已驗證的構詞分析；沒有可靠資料時不會猜。</p><form className="toolbar" role="search"><input className="input" name="q" defaultValue={term} placeholder="Try predict, transport, biology…" aria-label="Word Builder search"/><button className="btn primary">Analyze</button></form>{term&&exact?<WordBuilder word={exact.word} parts={exact.morphology||[]} explanation={exact.morphologyExplanation}/>:term?<div className="card">找不到「{term}」的已驗證構詞分析。你可以從下方有可靠 morphology 的詞彙選擇。</div>:<div className="card">輸入一個英文單字，或從下方資料庫中的已驗證詞彙開始。</div>}<h2>Verified words</h2><div className="chip-list">{suggestions.map(v=><Link className="chip" href={`/word-builder?q=${encodeURIComponent(v.word)}`} key={String(v._id)}>{v.word} <span className="muted">L{v.ceecLevel}</span></Link>)}</div></main>;
}
