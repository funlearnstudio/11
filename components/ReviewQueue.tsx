'use client';

import { useState } from 'react';
import ReviewCard from '@/components/ReviewCard';

type ReviewWord = {
  vocabularyId: string;
  word: string;
  ipa?: string;
  definitionsZhTW?: string[];
  definitionsEn?: string[];
  examples?: { en: string; zhTW?: string }[];
};

export default function ReviewQueue({ items }: { items: ReviewWord[] }) {
  const [index, setIndex] = useState(0);
  if (items.length === 0) return <div className="card"><h2>All caught up</h2><p>現在沒有到期的單字。下一次複習時間會依 SRS 排程自動出現。</p></div>;
  if (index >= items.length) return <div className="card"><h2>Review complete</h2><p>這一輪到期單字已完成。</p></div>;
  return <>
    <p className="muted">{index + 1} / {items.length}</p>
    <ReviewCard item={items[index]} onDone={() => setIndex(value => value + 1)}/>
  </>;
}
