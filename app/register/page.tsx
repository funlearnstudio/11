'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage(){
  const router = useRouter();
  const [form,setForm]=useState({displayName:'',email:'',password:'',confirmPassword:''});
  const [state,setState]=useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message,setMessage]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();setState('loading');setMessage('');const r=await fetch('/api/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});const data=await r.json();if(!r.ok){setState('error');setMessage(data.error||'註冊失敗');return;}setState('success');setMessage('帳號建立完成');setTimeout(()=>router.push('/login'),500)}
  return <main className="content" style={{maxWidth:560}}><div className="brand">Lexora</div><h1>建立帳號</h1><form className="card" onSubmit={submit}>
    <label>顯示名稱<input className="input" style={{width:'100%',margin:'6px 0 14px'}} value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} required/></label>
    <label>Email<input className="input" type="email" style={{width:'100%',margin:'6px 0 14px'}} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>
    <label>密碼<input className="input" type="password" minLength={8} style={{width:'100%',margin:'6px 0 14px'}} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label>
    <label>確認密碼<input className="input" type="password" minLength={8} style={{width:'100%',margin:'6px 0 14px'}} value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} required/></label>
    <button className="btn primary" disabled={state==='loading'}>{state==='loading'?'建立中…':'建立帳號'}</button>{message&&<p role="status" className={state==='error'?'':'muted'}>{message}</p>}
  </form></main>
}
