'use client';

import { useMemo, useState } from 'react';
import SpeakButton from '@/components/SpeakButton';

type Word = { word: string; ipa?: string; partOfSpeech?: string[]; definitionsZhTW?: string[]; definitionsEn?: string[] };

export default function ArticleReader({ body, words }: { body: string; words: Word[] }) {
  const [selected, setSelected] = useState<Word | null>(null);
  const lookup = useMemo(() => new Map(words.map(word => [word.word.toLowerCase(), word])), [words]);
  const parts = body.split(/(\b[A-Za-z][A-Za-z'-]*\b)/g);

  return <>
    <div className="card" style={{ lineHeight: 1.9, fontSize: '1.08rem' }}>
      <div className="toolbar"><SpeakButton text={body}/></div>
      <div>{parts.map((part, index) => {
        const match = lookup.get(part.toLowerCase());
        return match ? <button key={index} className="vocab-highlight" onClick={() => setSelected(match)} aria-label={`Open vocabulary details for ${match.word}`}>{part}</button> : part;
      })}</div>
    </div>
    {selected && <aside className="card" role="dialog" aria-modal="false" aria-label={`${selected.word} definition`}>
      <div className="toolbar"><h2 style={{ margin: 0 }}>{selected.word}</h2><SpeakButton text={selected.word}/><button className="btn" onClick={() => setSelected(null)}>Close</button></div>
      {selected.ipa && <p>{selected.ipa}</p>}
      {selected.partOfSpeech?.length ? <p className="muted">{selected.partOfSpeech.join(', ')}</p> : null}
      {selected.definitionsZhTW?.length ? <p>{selected.definitionsZhTW.join('；')}</p> : null}
      {selected.definitionsEn?.length ? <p>{selected.definitionsEn.join('; ')}</p> : null}
    </aside>}
  </>;
}
