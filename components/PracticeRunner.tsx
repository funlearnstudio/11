'use client';
import { useEffect,useState } from 'react';

type Question={_id:string;question:string;options?:string[];type:string;difficulty:number;category:string};

export default function PracticeRunner({type='mixed'}:{type?:string}){
  const [items,setItems]=useState<Question[]>([]);const [index,setIndex]=useState(0);const [answer,setAnswer]=useState('');const [feedback,setFeedback]=useState<any>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [startedAt,setStartedAt]=useState(Date.now());
  useEffect(()=>{fetch(`/api/practice?type=${encodeURIComponent(type)}&count=10`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to load practice');setItems(j.items||[])}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[type]);
  const q=items[index];
  async function submit(){if(!q||!answer)return;const r=await fetch('/api/practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:q._id,answer,durationSeconds:Math.round((Date.now()-startedAt)/1000)})});const j=await r.json();if(!r.ok){setError(j.error||'Unable to grade');return}setFeedback(j)}
  function next(){setFeedback(null);setAnswer('');setStartedAt(Date.now());setIndex(i=>Math.min(i+1,items.length-1))}
  if(loading)return <div className="card">Loading practice…</div>;if(error)return <div className="card">{error}</div>;if(!q)return <div className="card">No verified practice questions available.</div>;
  return <div className="card"><p className="muted">{index+1}/{items.length} · {q.type} · difficulty {q.difficulty}</p><h2>{q.question}</h2>{q.options?.length?<div className="list">{q.options.map(o=><label className="card" key={o}><input type="radio" name={q._id} checked={answer===o} disabled={!!feedback} onChange={()=>setAnswer(o)}/> {o}</label>)}</div>:<input className="input" value={answer} disabled={!!feedback} onChange={e=>setAnswer(e.target.value)} placeholder="Type your answer"/>}{!feedback?<div className="toolbar"><button className="btn primary" disabled={!answer} onClick={submit}>Check answer</button></div>:<div className="card" style={{marginTop:16}}><h3>{feedback.correct?'✓ Correct':'✕ Review this one'}</h3><p><strong>Answer:</strong> {String(feedback.answer)}</p><p>{feedback.explanation}</p>{feedback.optionExplanations?.length?<ul>{feedback.optionExplanations.map((x:any)=><li key={x.option}><strong>{x.option}:</strong> {x.explanation}</li>)}</ul>:null}<p className="muted">XP +{feedback.xpEarned}</p>{index+1<items.length?<button className="btn primary" onClick={next}>Next</button>:<p><strong>Practice set complete.</strong></p>}</div>}</div>;
}
