import Link from 'next/link';
const games=[
  ['Word Match','word-match'],
  ['Definition Match','definition-match'],
  ['Speed Quiz','speed-quiz'],
  ['Spelling Challenge','spelling-challenge'],
  ['Falling Words','falling-words'],
  ['Sentence Builder','sentence-builder'],
  ['Cloze Challenge','cloze-challenge'],
  ['Root Builder','root-builder'],
  ['Vocabulary Battle','vocabulary-battle'],
  ['Memory Cards','memory-cards']
] as const;
export default function GamesPage(){return <main className="content"><h1>Games</h1><p className="muted">遊戲使用已驗證詞彙與學習紀錄；資料不足時不會生成假題。</p><div className="grid">{games.map(([name,slug])=><div className="card" key={slug}><h2>{name}</h2><Link className="btn primary" href={`/games/${slug}`}>Play</Link></div>)}</div></main>}
