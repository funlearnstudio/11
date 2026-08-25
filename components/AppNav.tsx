'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import LogoutButton from '@/components/LogoutButton';

const primary=[['Home','/dashboard'],['Vocabulary','/vocabulary'],['Review','/review'],['Grammar','/grammar'],['Reading','/reading'],['Dictionary','/dictionary'],['Practice','/practice'],['Games','/games'],['Exams','/exams'],['Progress','/progress']] as const;
const more=[['Listening','/listening'],['Word Roots','/word-roots'],['Word Builder','/word-builder'],['Wrong Answers','/wrong-answers'],['Profile','/profile'],['Settings','/settings']] as const;
const publicRoutes=new Set(['/','/login','/register','/forgot-password','/reset-password']);

type SessionState={authenticated:boolean;role?:string};
export default function AppNav(){
  const pathname=usePathname();const [open,setOpen]=useState(false);const [session,setSession]=useState<SessionState>({authenticated:false});
  useEffect(()=>{let cancelled=false;fetch('/api/auth/session',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!cancelled)setSession({authenticated:!!j?.user,role:j?.user?.role})}).catch(()=>{});return()=>{cancelled=true}},[pathname]);
  if(publicRoutes.has(pathname))return null;const active=(href:string)=>pathname===href||pathname.startsWith(`${href}/`);
  if(!session.authenticated)return <header className="app-topbar" aria-label="Public navigation"><Link className="brand" href="/">Lexora</Link><nav className="app-toplinks"><Link href="/vocabulary">Vocabulary</Link><Link href="/grammar">Grammar</Link><Link href="/reading">Reading</Link><Link href="/dictionary">Dictionary</Link></nav><Link className="btn primary" href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>Login</Link></header>;
  const extra=session.role==='admin'?[...more,['Admin','/admin'] as const]:more;
  return <><header className="app-topbar" aria-label="Main navigation"><Link className="brand" href="/dashboard">Lexora</Link><nav className="app-toplinks">{primary.slice(0,7).map(([label,href])=><Link key={href} className={active(href)?'active':''} href={href}>{label}</Link>)}</nav><button className="btn" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="more-navigation">More</button>{open&&<div id="more-navigation" className="more-menu" role="menu">{[...primary.slice(7),...extra].map(([label,href])=><Link key={href} role="menuitem" className={active(href)?'active':''} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}<LogoutButton className="menu-logout"/></div>}</header><nav className="bottom-nav" aria-label="Mobile navigation">{primary.slice(0,4).map(([label,href])=><Link key={href} className={active(href)?'active':''} href={href}><span>{label==='Home'?'⌂':label==='Vocabulary'?'Aa':label==='Review'?'↻':'G'}</span><small>{label}</small></Link>)}<button type="button" className={open?'active':''} onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span>•••</span><small>More</small></button></nav>{open&&<div className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More navigation"><div className="toolbar" style={{justifyContent:'space-between'}}><strong>More</strong><button className="btn" type="button" onClick={()=>setOpen(false)}>Close</button></div><div className="grid-links">{[...primary.slice(4),...extra].map(([label,href])=><Link key={href} className={active(href)?'active':''} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}</div><LogoutButton className="btn"/></div>}</>;
}
