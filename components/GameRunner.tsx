'use client';

import { useEffect, useMemo, useState } from 'react';

type Round = {
  vocabularyId: string;
  word?: string;
  prompt: string;
  answer: string;
  options: string[];
  example?: string | null;
};

export default function GameRunner({ mode }: { mode: string }) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games?mode=${encodeURIComponent(mode)}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Unable to load game');
        if (!cancelled) setRounds(json.rounds || []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const current = rounds[index];
  const accuracy = useMemo(() => {
    const answered = correct + wrong.length;
    return answered ? Math.round((correct / answered) * 100) : 0;
  }, [correct, wrong.length]);

  async function finish(nextScore: number, nextCorrect: number, nextWrong: string[]) {
    setDone(true);
    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          score: nextScore,
          correct: nextCorrect,
          wrong: nextWrong.length,
          vocabularyIds: nextWrong,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000)
        })
      });
    } catch {
      // The result page still renders; persistence failure does not erase the completed round.
    }
  }

  async function choose(answer: string) {
    if (!current || done) return;
    const isCorrect = answer === current.answer;
    const nextScore = score + (isCorrect ? 100 : 0);
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextWrong = isCorrect ? wrong : [...wrong, current.vocabularyId];

    setScore(nextScore);
    setCorrect(nextCorrect);
    setWrong(nextWrong);

    if (index + 1 >= rounds.length) {
      await finish(nextScore, nextCorrect, nextWrong);
    } else {
      setIndex((value) => value + 1);
    }
  }

  if (error) return <div className="card">{error}</div>;
  if (!rounds.length) return <div className="card">正在準備題目；若資料庫沒有足夠的正式詞彙，遊戲不會產生假題。</div>;
  if (done) return <div className="card"><h2>Game Complete</h2><p>Score: {score}</p><p>Accuracy: {accuracy}%</p><p>Correct: {correct} · Wrong: {wrong.length}</p><p>Words to review: {wrong.length}</p></div>;

  return <div className="card">
    <p className="muted">{index + 1}/{rounds.length} · {mode}</p>
    <h2>{current.prompt}</h2>
    {mode === 'spelling-challenge' ? (
      <div className="list">
        <button className="btn" type="button" onClick={() => {
          const utterance = new SpeechSynthesisUtterance(current.word || current.answer);
          utterance.lang = 'en-US';
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }}>▶ Play audio</button>
        {current.options.map((option) => <button className="btn" key={option} onClick={() => choose(option)}>{option}</button>)}
      </div>
    ) : (
      <div className="list">{current.options.map((option) => <button className="btn" key={option} onClick={() => choose(option)}>{option}</button>)}</div>
    )}
  </div>;
}
