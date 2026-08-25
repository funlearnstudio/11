'use client';

import { FormEvent, useEffect, useState } from 'react';

type Settings = {
  theme: 'light' | 'dark' | 'system';
  pronunciation: 'US' | 'UK';
  ttsSpeed: number;
  dailyNewWordGoal: number;
  dailyReviewGoal: number;
  soundEffects: boolean;
  reducedMotion: boolean;
};

const defaults: Settings = {
  theme: 'system', pronunciation: 'US', ttsSpeed: 1,
  dailyNewWordGoal: 10, dailyReviewGoal: 30,
  soundEffects: true, reducedMotion: false
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/settings').then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSettings({ ...defaults, ...data.settings });
      setStatus('idle');
    }).catch(() => setStatus('error'));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setStatus('saving');
    const response = await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
    });
    setStatus(response.ok ? 'saved' : 'error');
  }

  if (status === 'loading') return <main className="content"><p>Loading settings…</p></main>;

  return <main className="content">
    <h1>Settings</h1>
    <p className="muted">Your preferences are saved to your account and follow you across devices.</p>
    <form className="card list" onSubmit={save}>
      <label>Appearance
        <select className="select" value={settings.theme} onChange={e => setSettings({ ...settings, theme: e.target.value as Settings['theme'] })}>
          <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
      <label>Pronunciation
        <select className="select" value={settings.pronunciation} onChange={e => setSettings({ ...settings, pronunciation: e.target.value as 'US' | 'UK' })}>
          <option value="US">US English</option><option value="UK">UK English</option>
        </select>
      </label>
      <label>TTS speed
        <input className="input" type="number" step="0.1" min="0.5" max="2" value={settings.ttsSpeed} onChange={e => setSettings({ ...settings, ttsSpeed: Number(e.target.value) })}/>
      </label>
      <label>Daily new-word goal
        <input className="input" type="number" min="1" max="100" value={settings.dailyNewWordGoal} onChange={e => setSettings({ ...settings, dailyNewWordGoal: Number(e.target.value) })}/>
      </label>
      <label>Daily review goal
        <input className="input" type="number" min="1" max="300" value={settings.dailyReviewGoal} onChange={e => setSettings({ ...settings, dailyReviewGoal: Number(e.target.value) })}/>
      </label>
      <label><input type="checkbox" checked={settings.soundEffects} onChange={e => setSettings({ ...settings, soundEffects: e.target.checked })}/> Sound effects</label>
      <label><input type="checkbox" checked={settings.reducedMotion} onChange={e => setSettings({ ...settings, reducedMotion: e.target.checked })}/> Reduced motion</label>
      <button className="btn primary" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save settings'}</button>
      {status === 'saved' && <p role="status">Saved.</p>}
      {status === 'error' && <p role="alert">Could not save settings. Please try again.</p>}
    </form>
  </main>;
}
