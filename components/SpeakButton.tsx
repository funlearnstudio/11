'use client';
import { useEffect,useRef,useState } from 'react';

function prefs(defaultLang:'en-US'|'en-GB',defaultRate:number){
  if(typeof window==='undefined')return{lang:defaultLang,rate:defaultRate};
  const p=localStorage.getItem('lexora.pronunciation');
  const saved=Number(localStorage.getItem('lexora.ttsSpeed')||defaultRate);
  return{lang:(p==='UK'?'en-GB':p==='US'?'en-US':defaultLang) as 'en-US'|'en-GB',rate:Math.max(.5,Math.min(2,Number.isFinite(saved)?saved:defaultRate))};
}

export function SpeakButton({ text, lang='en-US', rate=1 }:{text:string;lang?:'en-US'|'en-GB';rate?:number}){
  const [speaking,setSpeaking]=useState(false);const [paused,setPaused]=useState(false);const audioRef=useRef<HTMLAudioElement|null>(null);
  useEffect(()=>()=>{if(typeof window!=='undefined'){window.speechSynthesis?.cancel();audioRef.current?.pause();if(audioRef.current?.src.startsWith('blob:'))URL.revokeObjectURL(audioRef.current.src)}},[]);

  function browserSpeak(locale:'en-US'|'en-GB',speed:number){
    if(!('speechSynthesis'in window))return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang=locale;u.rate=speed;
    const voices=window.speechSynthesis.getVoices();
    u.voice=voices.find(v=>v.lang===locale)||voices.find(v=>v.lang.startsWith(locale.slice(0,2)))||null;
    u.onstart=()=>{setSpeaking(true);setPaused(false)};u.onend=()=>{setSpeaking(false);setPaused(false)};u.onerror=()=>{setSpeaking(false);setPaused(false)};
    window.speechSynthesis.speak(u);
  }

  async function play(){
    const {lang:locale,rate:speed}=prefs(lang,rate);stop();
    try{
      const r=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,locale,speed})});
      if(r.ok&&r.status!==204&&(r.headers.get('content-type')||'').startsWith('audio/')){
        const url=URL.createObjectURL(await r.blob());const audio=new Audio(url);audio.playbackRate=speed;audioRef.current=audio;
        audio.onplay=()=>{setSpeaking(true);setPaused(false)};audio.onended=()=>{setSpeaking(false);URL.revokeObjectURL(url)};audio.onerror=()=>{setSpeaking(false);URL.revokeObjectURL(url);browserSpeak(locale,speed)};
        await audio.play();return;
      }
    }catch{}
    browserSpeak(locale,speed);
  }
  function pause(){const a=audioRef.current;if(a&&!a.paused){a.pause();setPaused(true);return}if(window.speechSynthesis?.speaking&&!window.speechSynthesis.paused){window.speechSynthesis.pause();setPaused(true)}}
  function resume(){const a=audioRef.current;if(a&&a.paused&&!a.ended){a.play().catch(()=>{});setPaused(false);return}if(window.speechSynthesis?.paused){window.speechSynthesis.resume();setPaused(false)}}
  function stop(){const a=audioRef.current;if(a){a.pause();if(a.src.startsWith('blob:'))URL.revokeObjectURL(a.src);audioRef.current=null}if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();setSpeaking(false);setPaused(false)}
  return <span className="tts-controls"><button className="btn" type="button" onClick={play} aria-label={`朗讀：${text.slice(0,40)}`}>{speaking?'Replay':'🔊'}</button>{text.length>80&&speaking?<>{paused?<button className="btn" type="button" onClick={resume} aria-label="Resume reading">Resume</button>:<button className="btn" type="button" onClick={pause} aria-label="Pause reading">Pause</button>}<button className="btn" type="button" onClick={stop} aria-label="Stop reading">Stop</button></>:null}</span>;
}
export default SpeakButton;
