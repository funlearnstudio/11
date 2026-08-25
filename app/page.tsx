import Link from 'next/link';

export default function HomePage(){
  return <main className="content">
    <header className="toolbar"><div className="brand">Lexora</div><span style={{flex:1}}/><Link className="btn" href="/login">登入</Link><Link className="btn primary" href="/register">開始學習</Link></header>
    <section className="hero"><p className="muted">Taiwan High School English Learning Platform</p><h1>Learn English with structure, not guesswork.</h1><p>以大考中心高中英文參考詞彙為基礎，整合單字、間隔複習、文法、閱讀、聽力、題庫、遊戲與考試。所有正式統計數字都從資料庫即時計算，不硬寫「7000」。</p></section>
    <section className="grid">
      <div className="card"><h2>CEEC Vocabulary</h2><p className="muted">正式詞表匯入、分級、搜尋、篩選與獨立單字頁。</p></div>
      <div className="card"><h2>Smart Review</h2><p className="muted">Again / Hard / Good / Easy 驅動的個人化間隔複習。</p></div>
      <div className="card"><h2>Reading + Context</h2><p className="muted">用真正文章把剛學過與容易忘的字帶回語境。</p></div>
    </section>
  </main>
}
