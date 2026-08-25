'use client';
import { useEffect,useState } from 'react';

export default function VocabularyActions({vocabularyId}:{vocabularyId:string}){
  const [state,setState]=useState<{favorite:boolean;status:string;mastery:number}|null>(null);const [message,setMessage]=useState('');
  useEffect(()=>{fetch(`/api/vocabulary/actions?vocabularyId=${encodeURIComponent(vocabularyId)}`).then(async r=>{if(r.ok)setState(await r.json())}).catch(()=>{})},[vocabularyId]);
  async function act(action:'favorite'|'review'|'mastered'){
    setMessage('Saving…');
    const r=await fetch('/api/vocabulary/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabularyId,action})});
    const j=await r.json();
    if(!r.ok){setMessage(j.error||'Unable to save');return}
    setState(s=>({favorite:j.favorite??s?.favorite??false,status:j.status??s?.status??'unseen',mastery:j.mastery??s?.mastery??0}));
    setMessage('Saved');
  }
  return <div><div className="toolbar"><button className="btn" onClick={()=>act('favorite')}>{state?.favorite?'★ 收藏中':'☆ 收藏'}</button><button className="btn" onClick={()=>act('review')}>加入複習</button><button className="btn primary" onClick={()=>act('mastered')}>標記已學會</button></div><p className="muted" role="status">{state?`${state.status} · mastery ${state.mastery}%`:''} {message}</p></div>;
}
