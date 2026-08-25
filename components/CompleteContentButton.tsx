'use client';
import { useState } from 'react';

export default function CompleteContentButton({kind,id}:{kind:'grammar'|'reading';id:string}){
  const [status,setStatus]=useState('');
  const [startedAt]=useState(Date.now());
  async function complete(){
    setStatus('Saving…');
    const r=await fetch('/api/progress/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id,completed:true,durationSeconds:Math.round((Date.now()-startedAt)/1000)})});
    const j=await r.json();
    setStatus(r.ok?'Completed and saved':j.error||'Unable to save progress');
  }
  return <div className="toolbar"><button className="btn primary" type="button" onClick={complete}>Mark as completed</button><span className="muted" role="status">{status}</span></div>;
}
