'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function CompleteContentButton({kind,id,authenticated}:{kind:'grammar'|'reading';id:string;authenticated:boolean}){
  const [status,setStatus]=useState('');const [startedAt]=useState(Date.now());const [done,setDone]=useState(false);
  if(!authenticated)return <p className="muted"><Link href="/login">登入</Link>後即可儲存完成紀錄與 XP。</p>;
  async function complete(){if(done)return;setStatus('Saving…');try{const r=await fetch('/api/progress/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id,completed:true,durationSeconds:Math.round((Date.now()-startedAt)/1000)})});const j=await r.json().catch(()=>({}));if(!r.ok){setStatus(j.error||'Unable to save progress');return}setDone(true);setStatus(j.newlyCompleted?`Completed and saved · XP +${j.xpEarned||0}`:'Already completed · progress saved')}catch{setStatus('Unable to save progress')}}
  return <div className="toolbar"><button className="btn primary" type="button" disabled={done} onClick={complete}>{done?'Completed':'Mark as completed'}</button><span className="muted" role="status">{status}</span></div>;
}
