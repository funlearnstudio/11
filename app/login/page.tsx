'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage(){
  const router=useRouter(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');const result=await signIn('credentials',{email,password,redirect:false});setLoading(false);if(result?.error){setError('Email 或密碼錯誤');return;}router.push('/dashboard');router.refresh();}
  return <main className="content" style={{maxWidth:560}}><div className="brand">Lexora</div><h1>登入</h1><form className="card" onSubmit={submit}>
    <label>Email<input className="input" type="email" style={{width:'100%',margin:'6px 0 14px'}} value={email} onChange={e=>setEmail(e.target.value)} required/></label>
    <label>密碼<input className="input" type="password" style={{width:'100%',margin:'6px 0 14px'}} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    <button className="btn primary" disabled={loading}>{loading?'登入中…':'登入'}</button>{error&&<p role="alert">{error}</p>}
  </form></main>
}
