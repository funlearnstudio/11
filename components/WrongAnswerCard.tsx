'use client';
import { useState } from 'react';

type Item={_id:string;source:string;attempts:number;questionId:{question:string;options?:string[];answer:unknown;explanation:string}};
export default function WrongAnswerCard({item,index}:{item:Item;index:number}){
  const [answer,setAnswer]=useState('');const [message,setMessage]=useState('');const [resolved,setResolved]=useState(false);
  async function act(action:'retry'|'understood'){
    setMessage('Saving…');const r=await fetch('/api/wrong-answers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wrongAnswerId:item._id,action,answer})});const j=await r.json();if(!r.ok){setMessage(j.error||'Unable to update');return}if(action==='understood'||j.correct){setResolved(true);setMessage(action==='understood'?'Marked as understood':'Correct — removed from unresolved wrong answers.')}else setMessage(`Not yet. Answer: ${String(j.answer)} · ${j.explanation}`);
  }
  if(resolved)return <div className="card"><strong>✓ {item.questionId.question}</strong><p className="muted">Resolved</p></div>;
  return <article className="card"><p><strong>{index+1}. {item.questionId.question}</strong> · <span className="muted">{item.source}</span></p>{item.questionId.options?.length?<div className="list">{item.questionId.options.map(o=><label key={o}><input type="radio" name={item._id} checked={answer===o} onChange={()=>setAnswer(o)}/> {o}</label>)}</div>:<input className="input" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Try again"/>}<div className="toolbar"><button className="btn primary" disabled={!answer} onClick={()=>act('retry')}>Try again</button><button className="btn" onClick={()=>act('understood')}>Mark understood</button></div><p className="muted">Wrong attempts: {item.attempts}</p><p role="status">{message}</p></article>;
}
