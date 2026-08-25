'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordForm({token}:{token:string}){
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [message,setMessage]=useState(token?'':'Reset token is missing.');
  const [saving,setSaving]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!token){setMessage('Reset token is missing.');return;}
    if(password!==confirm){setMessage('Passwords do not match');return;}
    setSaving(true);setMessage('');
    try{
      const response=await fetch('/api/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});
      const json=await response.json();
      setMessage(response.ok?'Password updated. You can now log in.':json.error||'Unable to reset password');
    }finally{setSaving(false)}
  }
  return <div className="card" style={{maxWidth:520,margin:'40px auto'}}><h1>Reset password</h1><form onSubmit={submit}><label>New password<input className="input" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm password<input className="input" type="password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><div className="toolbar"><button className="btn primary" disabled={saving||!token}>{saving?'Updating…':'Update password'}</button><Link className="btn" href="/login">Back to login</Link></div><p className="muted" role="status">{message}</p></form></div>;
}
