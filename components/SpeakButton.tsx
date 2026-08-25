'use client';

export function SpeakButton({ text, lang='en-US' }:{text:string;lang?:'en-US'|'en-GB'}){
  function speak(){
    if(!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=lang;
    utterance.rate=1;
    const voices=window.speechSynthesis.getVoices();
    utterance.voice=voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.slice(0,2)))||null;
    window.speechSynthesis.speak(utterance);
  }
  return <button className="btn" type="button" onClick={speak} aria-label={`朗讀：${text.slice(0,40)}`}>🔊</button>
}
