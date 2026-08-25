'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function safeCallback(){
  if(typeof window==='undefined')return '/dashboard';
  const raw=new URLSearchParams(window.location.search).get('callbackUrl');
  if(!raw)return '/dashboard';
  try{const u=new URL(raw,window.location.origin);return u.origin===window.location.origin?`${u.pathname}${u.search}${u.hash}`:'/dashboard';}catch{return '/dashboard'}
}

export default function LoginPage(){
  const router=useRouter();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();if(loading)return;setLoading(true);setError('');try{const result=await signIn('credentials',{email:email.trim().toLowerCase(),password,redirect:false});if(result?.error){setError(result.error==='CredentialsSignin'?'Email 或密碼錯誤':'登入服務暫時無法使用，請稍後再試。');return}router.replace(safeCallback());router.refresh()}catch{setError('無法連線到登入服務，請稍後再試。')}finally{setLoading(false)}}
  return <main className="content" style={{maxWidth:560}}><div className="brand">Lexora</div><h1>登入</h1><form className="card" onSubmit={submit}><label>Email<input className="input" type="email" autoComplete="email" style={{width:'100%',margin:'6px 0 14px'}} value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>密碼<input className="input" type="password" autoComplete="current-password" minLength={8} style={{width:'100%',margin:'6px 0 14px'}} value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="btn primary" disabled={loading}>{loading?'登入中…':'登入'}</button>{error&&<p role="alert" className="danger">{error}</p>}<div className="toolbar" style={{marginTop:12}}><Link href="/forgot-password">忘記密碼？</Link><span className="muted">還沒有帳號？</span><Link href="/register">建立帳號</Link></div></form></main>;
}
