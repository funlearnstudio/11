'use client';
import { useState } from 'react';

type Part={form:string;type:'prefix'|'root'|'suffix';meaning?:string;origin?:string};
export default function WordBuilder({word,parts,explanation}:{word:string;parts:Part[];explanation?:string}){
  const [active,setActive]=useState<number>(0);
  if(!parts.length)return <div className="card"><h2>{word}</h2><p>此字不適合以目前已驗證的常見字根、字首、字尾方式分析，因此 Lexora 不強行拆字。</p></div>;
  const item=parts[active];
  return <div className="card"><p className="muted">Verified morphology</p><h2 className="builder-word">{word}</h2><div className="morph-strip">{parts.map((part,index)=><button className={`morph-part ${index===active?'active':''}`} type="button" key={`${part.type}-${part.form}-${index}`} onClick={()=>setActive(index)}><small>{part.type}</small><strong>{part.form}</strong></button>)}</div><div className="builder-explain"><h3>{item.form}</h3><p><strong>{item.type}</strong>{item.meaning?` · ${item.meaning}`:''}</p>{item.origin?<p className="muted">Origin: {item.origin}</p>:null}</div>{explanation?<p>{explanation}</p>:null}</div>;
}
