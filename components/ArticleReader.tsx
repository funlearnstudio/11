'use client';

import { useEffect,useMemo,useState } from 'react';
import SpeakButton from '@/components/SpeakButton';
import VocabularyActions from '@/components/VocabularyActions';

type Word={_id?:string;word:string;ipa?:string;partsOfSpeech?:string[];zhTWDefinitions?:string[];englishDefinitions?:string[]};

export default function ArticleReader({body,words}:{body:string;words:Word[]}){
  const [selected,setSelected]=useState<Word|null>(null);const [activeParagraph,setActiveParagraph]=useState<number|null>(null);const [paused,setPaused]=useState(false);
  const lookup=useMemo(()=>new Map(words.map(word=>[word.word.toLowerCase(),word])),[words]);
  const paragraphs=useMemo(()=>body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),[body]);
  useEffect(()=>()=>{if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel()},[]);

  function speechPrefs(){const locale=localStorage.getItem('lexora.pronunciation')==='UK'?'en-GB':'en-US';const rate=Math.max(.5,Math.min(2,Number(localStorage.getItem('lexora.ttsSpeed')||1)));return{locale,rate}}
  function readParagraph(index:number){
    if(!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const {locale,rate}=speechPrefs();const u=new SpeechSynthesisUtterance(paragraphs[index]);u.lang=locale;u.rate=rate;
    const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang===locale)||voices.find(v=>v.lang.startsWith('en'))||null;
    u.onstart=()=>{setActiveParagraph(index);setPaused(false)};u.onend=()=>{setActiveParagraph(null);setPaused(false)};u.onerror=()=>{setActiveParagraph(null);setPaused(false)};window.speechSynthesis.speak(u);
  }
  function pause(){if(window.speechSynthesis.speaking&&!window.speechSynthesis.paused){window.speechSynthesis.pause();setPaused(true)}}
  function resume(){if(window.speechSynthesis.paused){window.speechSynthesis.resume();setPaused(false)}}
  function stop(){window.speechSynthesis.cancel();setActiveParagraph(null);setPaused(false)}
  function renderParagraph(text:string,pIndex:number){const parts=text.split(/(\b[A-Za-z][A-Za-z'-]*\b)/g);return <p className={activeParagraph===pIndex?'reading-active':''}>{parts.map((part,index)=>{const match=lookup.get(part.toLowerCase());return match?<button key={index} className="vocab-highlight" type="button" onClick={()=>setSelected(match)} aria-label={`Open vocabulary details for ${match.word}`}>{part}</button>:part})}</p>}

  return <>
    <article className="card article-reader">
      <div className="toolbar"><SpeakButton text={body}/>{activeParagraph!==null?<>{paused?<button className="btn" type="button" onClick={resume}>Resume paragraph</button>:<button className="btn" type="button" onClick={pause}>Pause paragraph</button>}<button className="btn" type="button" onClick={stop}>Stop</button></>:null}</div>
      {paragraphs.map((paragraph,index)=><section className="article-paragraph" key={index}><button className="paragraph-read" type="button" onClick={()=>readParagraph(index)} aria-label={`Read paragraph ${index+1}`}>▶</button>{renderParagraph(paragraph,index)}</section>)}
    </article>
    {selected&&<aside className="card word-popover" role="dialog" aria-modal="false" aria-label={`${selected.word} definition`}>
      <div className="toolbar"><h2 style={{margin:0}}>{selected.word}</h2><SpeakButton text={selected.word}/><button className="btn" onClick={()=>setSelected(null)}>Close</button></div>
      {selected.ipa?<p>{selected.ipa}</p>:null}{selected.partsOfSpeech?.length?<p className="muted">{selected.partsOfSpeech.join(', ')}</p>:null}
      {selected.zhTWDefinitions?.length?<p><strong>中文：</strong>{selected.zhTWDefinitions.join('；')}</p>:null}
      {selected.englishDefinitions?.length?<p><strong>English:</strong> {selected.englishDefinitions.join('; ')}</p>:null}
      {selected._id?<VocabularyActions vocabularyId={String(selected._id)}/>:null}
    </aside>}
  </>;
}
