import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { SpeakButton } from '@/components/SpeakButton';

export default async function WordPage({params}:{params:Promise<{word:string}>}){
  const {word}=await params; await dbConnect(); const v:any=await Vocabulary.findOne({word:decodeURIComponent(word),published:true}).lean(); if(!v) notFound();
  return <main className="content"><div className="toolbar"><h1 style={{fontSize:56,margin:0}}>{v.word}</h1><SpeakButton text={v.word}/><span className="btn">Level {v.ceecLevel}</span></div><p className="muted">{v.ipa||'IPA not yet verified'} · {v.partsOfSpeech?.join(', ')}</p><section className="grid"><div className="card"><h2>中文解釋</h2>{v.zhTWDefinitions.map((x:string)=><p key={x}>{x}</p>)}</div><div className="card"><h2>English Definition</h2>{v.englishDefinitions.map((x:string)=><p key={x}>{x} <SpeakButton text={x}/></p>)}</div><div className="card"><h2>Collocations</h2>{v.collocations?.length?v.collocations.map((x:string)=><p key={x}>{x}</p>):<p className="muted">尚無已驗證搭配詞。</p>}</div></section><section className="card" style={{marginTop:16}}><h2>Examples</h2>{v.examples?.length?v.examples.map((x:any)=><div key={x.text}><p>{x.text} <SpeakButton text={x.text}/></p><p className="muted">{x.zhTW}</p></div>):<p className="muted">尚無已通過品質驗證的例句。</p>}</section><section className="card" style={{marginTop:16}}><h2>Word Structure</h2>{v.morphology?.length?v.morphology.map((m:any)=><p key={`${m.type}-${m.form}`}><strong>{m.form}</strong> · {m.type} · {m.meaning}</p>):<p className="muted">此字目前沒有可靠且適合教學的常見字根字首字尾分析，因此不強行拆字。</p>}</section></main>
}
