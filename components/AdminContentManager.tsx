'use client';
import { useEffect, useState } from 'react';

type ContentType = 'grammar'|'articles'|'questions'|'morphology';

function label(item:any,type:ContentType){
  if(type==='questions')return item.question;
  if(type==='morphology')return `${item.form} · ${item.type}`;
  return item.title||item.slug;
}

export default function AdminContentManager({type}:{type:ContentType}){
  const [q,setQ]=useState('');
  const [status,setStatus]=useState('all');
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');

  async function load(){
    setLoading(true);setMessage('');
    try{
      const r=await fetch(`/api/admin/content?type=${type}&q=${encodeURIComponent(q)}&status=${status}`);
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Unable to load content');
      setItems(j.items||[]);
    }catch(e:any){setMessage(e.message||'Unable to load content')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[type,status]);

  async function toggle(item:any){
    setMessage('Saving…');
    const r=await fetch('/api/admin/content',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,id:String(item._id),published:!item.published})});
    const j=await r.json();
    if(!r.ok){setMessage((j.validationErrors||[j.error||'Unable to save']).join(' · '));return}
    setMessage('Saved');
    setItems(xs=>xs.map(x=>String(x._id)===String(item._id)?{...x,published:j.published}:x));
  }

  return <div>
    <div className="toolbar">
      <input className="input" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load()}} placeholder={`Search ${type}`}/>
      <select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select>
      <button className="btn primary" onClick={load}>Search</button>
    </div>
    <p className="muted" role="status">{loading?'Loading…':message}</p>
    <div className="list">{items.map(item=><article className="card" key={String(item._id)}><div className="toolbar" style={{justifyContent:'space-between'}}><div><strong>{label(item,type)}</strong><div className="muted">{item.published?'Published':'Draft'} · updated {item.updatedAt?new Date(item.updatedAt).toLocaleDateString('zh-TW'):''}</div></div><button className="btn" onClick={()=>toggle(item)}>{item.published?'Unpublish':'Validate & publish'}</button></div>{type==='questions'?<p>{item.explanation}</p>:type==='articles'?<p>{String(item.body||'').slice(0,180)}{String(item.body||'').length>180?'…':''}</p>:type==='grammar'?<p>{item.zhExplanation}</p>:<p>{item.meaningZhTW} · {item.meaningEn}</p>}</article>)}</div>
    {!loading&&!items.length?<div className="card">No matching content.</div>:null}
  </div>;
}
