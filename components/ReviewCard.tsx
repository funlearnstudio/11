'use client';

import { useState } from 'react';
import SpeakButton from '@/components/SpeakButton';

type ReviewWord = {
  vocabularyId: string;
  word: string;
  ipa?: string;
  definitionsZhTW?: string[];
  definitionsEn?: string[];
  examples?: { en: string; zhTW?: string }[];
};

export default function ReviewCard({ item, onDone }: { item: ReviewWord; onDone: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<'idle'|'saving'|'error'>('idle');

  async function rate(rating: 'again'|'hard'|'good'|'easy') {
    setStatus('saving');
    const response = await fetch('/api/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vocabularyId: item.vocabularyId, rating, correct: rating !== 'again' })
    });
    if (!response.ok) { setStatus('error'); return; }
    onDone();
  }

  return <article className="card review-card">
    <div className="toolbar"><h2 style={{ margin: 0 }}>{item.word}</h2><SpeakButton text={item.word}/></div>
    {item.ipa && <p className="muted">{item.ipa}</p>}
    {!revealed ? <button className="btn primary" onClick={() => setRevealed(true)}>Show answer</button> : <>
      {item.definitionsZhTW?.length ? <p><strong>中文：</strong>{item.definitionsZhTW.join('；')}</p> : null}
      {item.definitionsEn?.length ? <p><strong>English:</strong> {item.definitionsEn.join('; ')}</p> : null}
      {item.examples?.[0]?.en ? <p>{item.examples[0].en} <SpeakButton text={item.examples[0].en}/></p> : null}
      <div className="review-actions">
        <button className="btn" disabled={status === 'saving'} onClick={() => rate('again')}>Again</button>
        <button className="btn" disabled={status === 'saving'} onClick={() => rate('hard')}>Hard</button>
        <button className="btn" disabled={status === 'saving'} onClick={() => rate('good')}>Good</button>
        <button className="btn primary" disabled={status === 'saving'} onClick={() => rate('easy')}>Easy</button>
      </div>
      {status === 'error' && <p role="alert">Could not save this review. Try again.</p>}
    </>}
  </article>;
}
