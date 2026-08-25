'use client';

import { useEffect,useMemo,useState } from 'react';

type Round={vocabularyId:string;word?:string;prompt:string;answer:string;options:string[];tokens?:string[];timeLimit?:number;audioText?:string};
type Pair={vocabularyId:string;word:string;meaning:string};
type Card={id:string;pairKey:string;vocabularyId:string;text:string};

const normalize=(value:string)=>value.trim().replace(/\s+/g,' ').toLowerCase();

export default function GameRunner({mode}:{mode:string}){
  const [rounds,setRounds]=useState<Round[]>([]);const [pairs,setPairs]=useState<Pair[]>([]);const [index,setIndex]=useState(0);const [score,setScore]=useState(0);const [correct,setCorrect]=useState(0);const [wrong,setWrong]=useState<string[]>([]);const [done,setDone]=useState(false);const [error,setError]=useState('');const [startedAt]=useState(Date.now());const [input,setInput]=useState('');const [built,setBuilt]=useState<string[]>([]);const [lives,setLives]=useState(3);const [remaining,setRemaining]=useState(0);const [result,setResult]=useState<any>(null);const [memoryFlipped,setMemoryFlipped]=useState<string[]>([]);const [memoryMatched,setMemoryMatched]=useState<string[]>([]);

  useEffect(()=>{let cancelled=false;fetch(`/api/games?mode=${encodeURIComponent(mode)}`).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to load game');if(cancelled)return;setRounds(j.rounds||[]);setPairs(j.pairs||[])}).catch((e:Error)=>!cancelled&&setError(e.message));return()=>{cancelled=true}},[mode]);
  const current=rounds[index];
  useEffect(()=>{setInput('');setBuilt([]);setRemaining(current?.timeLimit||0)},[index,current?.timeLimit]);

  async function finish(nextScore:number,nextCorrect:number,nextWrong:string[]){
    setDone(true);try{const r=await fetch('/api/games',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,score:nextScore,correct:nextCorrect,wrong:nextWrong.length,vocabularyIds:[...new Set(nextWrong)],durationSeconds:Math.round((Date.now()-startedAt)/1000)})});if(r.ok)setResult(await r.json())}catch{}
  }

  async function answer(value:string){
    if(!current||done)return;const ok=normalize(value)===normalize(current.answer);const nextScore=score+(ok?mode==='speed-quiz'?Math.max(50,100+remaining*10):100:0);const nextCorrect=correct+(ok?1:0);const nextWrong=ok?wrong:[...wrong,current.vocabularyId];const nextLives=mode==='vocabulary-battle'&&!ok?lives-1:lives;
    setScore(nextScore);setCorrect(nextCorrect);setWrong(nextWrong);setLives(nextLives);
    if((mode==='vocabulary-battle'&&nextLives<=0)||index+1>=rounds.length){await finish(nextScore,nextCorrect,nextWrong)}else setIndex(v=>v+1);
  }

  useEffect(()=>{
    if(done||!current?.timeLimit||remaining<=0)return;
    const timer=window.setTimeout(()=>{if(remaining<=1)void answer('__time_out__');else setRemaining(v=>v-1)},1000);
    return()=>window.clearTimeout(timer);
  // answer intentionally follows current render state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[remaining,index,done,current?.timeLimit]);

  const memoryCards=useMemo<Card[]>(()=>pairs.length?[...pairs.flatMap(p=>[{id:`${p.vocabularyId}-w`,pairKey:p.vocabularyId,vocabularyId:p.vocabularyId,text:p.word},{id:`${p.vocabularyId}-m`,pairKey:p.vocabularyId,vocabularyId:p.vocabularyId,text:p.meaning}])].sort(()=>Math.random()-.5):[],[pairs]);
  async function flipMemory(card:Card){
    if(done||memoryMatched.includes(card.pairKey)||memoryFlipped.includes(card.id)||memoryFlipped.length>=2)return;
    const next=[...memoryFlipped,card.id];setMemoryFlipped(next);
    if(next.length!==2)return;
    const a=memoryCards.find(c=>c.id===next[0]);const b=memoryCards.find(c=>c.id===next[1]);
    if(a&&b&&a.pairKey===b.pairKey){const matched=[...memoryMatched,a.pairKey];const nextCorrect=correct+1;const nextScore=score+150;setMemoryMatched(matched);setCorrect(nextCorrect);setScore(nextScore);setMemoryFlipped([]);if(matched.length===pairs.length)await finish(nextScore,nextCorrect,wrong)}else{const misses=[...wrong,...(a?[a.vocabularyId]:[]),...(b?[b.vocabularyId]:[])];setWrong(misses);window.setTimeout(()=>setMemoryFlipped([]),650)}
  }

  const accuracy=useMemo(()=>{const total=correct+wrong.length;return total?Math.round(correct/total*100):0},[correct,wrong.length]);
  function playAudio(){if(!current)return;const text=current.audioText||current.word||current.answer;if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=localStorage.getItem('lexora.pronunciation')==='UK'?'en-GB':'en-US';u.rate=Math.max(.5,Math.min(2,Number(localStorage.getItem('lexora.ttsSpeed')||1)));window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}

  if(error)return <div className="card error-state"><h2>Unable to start game</h2><p>{error}</p></div>;
  if(mode==='memory-cards'&&pairs.length){return <div className="card"><div className="toolbar"><strong>Memory Cards</strong><span className="muted">Matched {memoryMatched.length}/{pairs.length}</span></div><div className="memory-grid">{memoryCards.map(card=>{const visible=memoryFlipped.includes(card.id)||memoryMatched.includes(card.pairKey);return <button type="button" key={card.id} className={`memory-card ${visible?'revealed':''}`} onClick={()=>flipMemory(card)}>{visible?card.text:'?'}</button>})}</div>{done?<div className="game-result"><h2>Game Complete</h2><p>Score {score} · matched {correct}/{pairs.length}</p><p>XP +{result?.xpEarned||0}</p></div>:null}</div>}
  if(!rounds.length)return <div className="card loading-state">正在準備已驗證題目；若資料庫資料不足，遊戲不會產生假題。</div>;
  if(done)return <div className="card game-result"><h2>{mode==='vocabulary-battle'&&lives<=0?'Battle Over':'Game Complete'}</h2><div className="grid"><div><strong>Score</strong><p>{score}</p></div><div><strong>Accuracy</strong><p>{accuracy}%</p></div><div><strong>XP</strong><p>+{result?.xpEarned||0}</p></div></div><p>Correct {correct} · Wrong {wrong.length} · Words to review {[...new Set(wrong)].length}</p>{result?<p className="muted">Level {result.level} · Total XP {result.totalXp}</p>:null}</div>;

  const sentenceMode=mode==='sentence-builder';const spelling=mode==='spelling-challenge';
  return <div className={`card game-panel game-${mode}`}>
    <div className="toolbar" style={{justifyContent:'space-between'}}><strong>{index+1}/{rounds.length}</strong><span className="muted">Score {score}</span>{current.timeLimit?<span className={remaining<=2?'danger':''}>⏱ {remaining}s</span>:null}{mode==='vocabulary-battle'?<span>♥ {lives}</span>:null}</div>
    <h2>{current.prompt}</h2>
    {spelling?<><button className="btn" type="button" onClick={playAudio}>▶ Play pronunciation</button><form className="toolbar" onSubmit={e=>{e.preventDefault();void answer(input)}}><input className="input" autoFocus autoComplete="off" value={input} onChange={e=>setInput(e.target.value)} placeholder="Type the English word"/><button className="btn primary">Check spelling</button></form></>:sentenceMode?<><div className="sentence-built">{built.length?built.join(' '):<span className="muted">Tap words to build the sentence</span>}</div><div className="chip-list">{(current.tokens||current.options).map((token,i)=><button className="chip" type="button" key={`${token}-${i}`} onClick={()=>setBuilt(v=>[...v,token])}>{token}</button>)}</div><div className="toolbar"><button className="btn" type="button" onClick={()=>setBuilt([])}>Reset</button><button className="btn primary" type="button" onClick={()=>void answer(built.join(' '))}>Check sentence</button></div></>:<div className={mode==='falling-words'?'falling-options':'list'}>{current.options.map(option=><button className="btn option-btn" key={option} type="button" onClick={()=>void answer(option)}>{option}</button>)}</div>}
  </div>;
}
