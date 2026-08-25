'use client';

import { useEffect } from 'react';

type Settings={theme?:'light'|'dark'|'system';pronunciation?:'US'|'UK';ttsSpeed?:number;reducedMotion?:boolean};

function apply(settings:Settings){
  const root=document.documentElement;
  if(settings.theme&&settings.theme!=='system') root.dataset.theme=settings.theme; else delete root.dataset.theme;
  root.dataset.reducedMotion=settings.reducedMotion?'true':'false';
  if(settings.pronunciation)localStorage.setItem('lexora.pronunciation',settings.pronunciation);
  if(typeof settings.ttsSpeed==='number')localStorage.setItem('lexora.ttsSpeed',String(settings.ttsSpeed));
  if(settings.theme)localStorage.setItem('lexora.theme',settings.theme);
  localStorage.setItem('lexora.reducedMotion',String(!!settings.reducedMotion));
}

export default function ThemeBoot(){
  useEffect(()=>{
    const cached:Settings={
      theme:(localStorage.getItem('lexora.theme')||'system') as Settings['theme'],
      pronunciation:(localStorage.getItem('lexora.pronunciation')||'US') as Settings['pronunciation'],
      ttsSpeed:Number(localStorage.getItem('lexora.ttsSpeed')||1),
      reducedMotion:localStorage.getItem('lexora.reducedMotion')==='true'
    };
    apply(cached);

    // Settings are private account data. Only request them when Auth.js
    // confirms that a user session exists; public pages should not create
    // expected 401 requests in the browser console.
    fetch('/api/auth/session')
      .then(async sessionResponse=>{
        if(!sessionResponse.ok)return null;
        return sessionResponse.json();
      })
      .then(async session=>{
        if(!session?.user)return;
        const settingsResponse=await fetch('/api/settings');
        if(!settingsResponse.ok)return;
        const data=await settingsResponse.json();
        if(data.settings)apply(data.settings);
      })
      .catch(()=>{});

    const onSettings=(event:Event)=>apply((event as CustomEvent<Settings>).detail||{});
    window.addEventListener('lexora:settings',onSettings);
    return()=>window.removeEventListener('lexora:settings',onSettings);
  },[]);
  return null;
}
