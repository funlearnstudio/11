'use client';
import { useEffect,useState } from 'react';

type Item={_id:string;word:string;lemma:string;ceecLevel:number;partsOfSpeech:string[];zhTWDefinitions:string[];englishDefinitions:string[];ipa?:string;published:boolean};

export default function AdminVocabularyEditor(){
  const [q,setQ]=useState('');const [status,setStatus]=useState('all');const [items,setItems]=useState<Item[]>([]);const [loading,setLoading]=useState(false);const [message,setMessage]=useState('');
  async function load(){setLoading(true);setMessage('');try{const r=await fetch(`/api/admin/vocabulary?q=${encodeURIComponent(q)}&status=${status}`);const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to load');setItems(j.items||[])}catch(e:any){setMessage(e.message||'Unable to load')}finally{setLoading(false)}}
  useEffect(()=>{load()},[status]);
  async function toggle(item:Item){setMessage('Saving…');const r=await fetch('/api/admin/vocabulary',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item._id,published:!item.published})});const j=await r.json();if(!r.ok){setMessage((j.validationErrors||[j.error||'Unable to save']).join(' · '));return}setMessage('Saved');setItems(xs=>xs.map(x=>x._id===item._id?{...x,published:j.published}:x))}
  return <div><div className="toolbar"><input className="input" placeholder="Search vocabulary" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load()}}/><select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select><button className="btn primary" onClick={load}>Search</button></div><p className="muted">{loading?'Loading…':message}</p><div className="list">{items.map(item=><div className="wordrow" key={item._id}><div><strong>{item.word}</strong><div className="muted">Level {item.ceecLevel} · {item.partsOfSpeech?.join(', ')}</div><div>{item.zhTWDefinitions?.[0]||'缺少中文解釋'}</div></div><span>{item.published?'Published':'Draft'}</span><button className="btn" onClick={()=>toggle(item)}>{item.published?'Unpublish':'Publish'}</button></div>)}</div>{!loading&&!items.length?<div className="card">No matching entries.</div>:null}</div>
}
