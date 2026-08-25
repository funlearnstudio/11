'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';

export default function VocabularyActions({vocabularyId}:{vocabularyId:string}){
  const [authenticated,setAuthenticated]=useState<boolean|null>(null);const [state,setState]=useState<{favorite:boolean;status:string;mastery:number}|null>(null);const [message,setMessage]=useState('');const [saving,setSaving]=useState(false);
  useEffect(()=>{let cancelled=false;fetch('/api/auth/session',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(async session=>{if(cancelled)return;const logged=!!session?.user;setAuthenticated(logged);if(!logged)return;const r=await fetch(`/api/vocabulary/actions?vocabularyId=${encodeURIComponent(vocabularyId)}`);if(r.ok&&!cancelled)setState(await r.json())}).catch(()=>!cancelled&&setAuthenticated(false));return()=>{cancelled=true}},[vocabularyId]);
  async function act(action:'favorite'|'review'|'mastered'){if(saving)return;setSaving(true);setMessage('Saving…');try{const r=await fetch('/api/vocabulary/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabularyId,action})});const j=await r.json().catch(()=>({}));if(!r.ok){setMessage(j.error||'Unable to save');return}setState(s=>({favorite:j.favorite??s?.favorite??false,status:j.status??s?.status??'unseen',mastery:j.mastery??s?.mastery??0}));setMessage('Saved')}catch{setMessage('Unable to save')}finally{setSaving(false)}}
  if(authenticated===false)return <p className="muted"><Link href="/login">登入</Link>後即可收藏、加入複習與同步熟練度。</p>;
  if(authenticated===null)return <p className="muted">Loading learning actions…</p>;
  return <div><div className="toolbar"><button className="btn" disabled={saving} onClick={()=>act('favorite')}>{state?.favorite?'★ 收藏中':'☆ 收藏'}</button><button className="btn" disabled={saving} onClick={()=>act('review')}>加入複習</button><button className="btn primary" disabled={saving} onClick={()=>act('mastered')}>標記已學會</button></div><p className="muted" role="status">{state?`${state.status} · mastery ${state.mastery}%`:''} {message}</p></div>;
}
