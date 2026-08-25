'use client';
import { useEffect,useState } from 'react';

export function SpeakButton({ text, lang='en-US', rate=1 }:{text:string;lang?:'en-US'|'en-GB';rate?:number}){
  const [speaking,setSpeaking]=useState(false);
  const [paused,setPaused]=useState(false);
  useEffect(()=>()=>{if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel()},[]);
  function play(){if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=Math.max(.5,Math.min(2,rate));const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.slice(0,2)))||null;u.onstart=()=>{setSpeaking(true);setPaused(false)};u.onend=()=>{setSpeaking(false);setPaused(false)};u.onerror=()=>{setSpeaking(false);setPaused(false)};window.speechSynthesis.speak(u)}
  function pause(){if(window.speechSynthesis.speaking&&!window.speechSynthesis.paused){window.speechSynthesis.pause();setPaused(true)}}
  function resume(){if(window.speechSynthesis.paused){window.speechSynthesis.resume();setPaused(false)}}
  function stop(){window.speechSynthesis.cancel();setSpeaking(false);setPaused(false)}
  return <span className="tts-controls"><button className="btn" type="button" onClick={play} aria-label={`朗讀：${text.slice(0,40)}`}>{speaking?'Replay':'🔊'}</button>{text.length>80&&speaking?<>{paused?<button className="btn" type="button" onClick={resume} aria-label="Resume reading">Resume</button>:<button className="btn" type="button" onClick={pause} aria-label="Pause reading">Pause</button>}<button className="btn" type="button" onClick={stop} aria-label="Stop reading">Stop</button></>:null}</span>
}

export default SpeakButton;
