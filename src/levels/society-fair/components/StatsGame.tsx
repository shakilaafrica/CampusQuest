/**
 * GenAI DECLARATION: The game logic in this file was generated with the
 * assistance of GenAI (ChatGPT). The AI-generated logic was reviewed,
 * integrated, and tested by the team.
 */


import React, { useEffect, useMemo, useState } from 'react';

type Phase = 'intro' | 'playing' | 'won' | 'lost';
type Turn = 'player' | 'society';
type Bean = { id: number; color: string; eaten: boolean };

const COLORS = ['#ef4444','#f59e0b','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#f97316','#84cc16'];
const TOTAL = 10;
const NPC_DELAY = 900;

const freshBeans = (): Bean[] => COLORS.map((color, id) => ({ id, color, eaten: false }));
const poisonPick = () => Math.floor(Math.random() * TOTAL);

export default function StatsGame({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [beans, setBeans] = useState<Bean[]>(freshBeans);
  const [poison, setPoison] = useState(poisonPick);
  const [turn, setTurn] = useState<Turn>('player');
  const [message, setMessage] = useState('One bean is poison. Can you outlast the StatsGeek?');

  const remaining = useMemo(() => beans.filter((b) => !b.eaten).length, [beans]);

  const start = () => {
    setBeans(freshBeans());
    setPoison(poisonPick());
    setTurn('player');
    setMessage('Your turn. Tap a bean to eat it.');
    setPhase('playing');
  };

  const eat = (id: number) => {
    if (phase !== 'playing' || turn !== 'player') return;
    const bean = beans.find((b) => b.id === id);
    if (!bean || bean.eaten) return;

    setBeans((prev) => prev.map((b) => (b.id === id ? { ...b, eaten: true } : b)));
    if (id === poison) {
      setMessage('You ate the poison. Better luck next time.');
      setPhase('lost');
      return;
    }
    setTurn('society');
    setMessage('The Society Member is choosing...');
  };

  useEffect(() => {
    if (phase !== 'playing' || turn !== 'society') return;
    const timer = window.setTimeout(() => {
      const available = beans.filter((b) => !b.eaten);
      if (!available.length) return;
      const chosen = available[Math.floor(Math.random() * available.length)];
      setBeans((prev) => prev.map((b) => (b.id === chosen.id ? { ...b, eaten: true } : b)));
      if (chosen.id === poison) {
        setMessage('The Society Member ate the poison! You win!');
        setPhase('won');
      } else {
        const after = Math.max(1, available.length - 1);
        setTurn('player');
        setMessage(`Your turn. 1 in ${after} chance.`);
      }
    }, NPC_DELAY);
    return () => window.clearTimeout(timer);
  }, [beans, onComplete, phase, poison, turn]);

  useEffect(() => {
    if (phase !== 'won') return;
    const timeout = window.setTimeout(onComplete, 650);
    return () => window.clearTimeout(timeout);
  }, [onComplete, phase]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase !== 'playing') {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase]);

  return (
    <div className="phoneGame poisonBeans">
      <div className="phoneTop">GAME OF CHANCE</div>
      <p className="poisonBeans__subtitle">A statistics lesson disguised as a snack.</p>

      {phase === 'intro' ? (
        <>
          <div className="poisonBeans__rules">
            <strong>HOW TO PLAY</strong>
            <ul>
              <li>There are 10 colourful beans.</li>
              <li>One bean is secretly poisoned.</li>
              <li>You and the StatsGeek take turns eating one.</li>
              <li>If you eat the poison, you lose.</li>
              <li>If the StatsGeek eats it first, you win.</li>
            </ul>
          </div>
          <button className="phoneAction" onClick={start}>START GAME</button>
        </>
      ) : (
        <>
          <div className="poisonBeans__stats">
            <span><small>TURN</small><b>{turn === 'player' ? 'YOU' : 'NPC'}</b></span>
            <span><small>BEANS</small><b>{remaining}</b></span>
            <span><small>ODDS</small><b>1 in {Math.max(1, remaining)}</b></span>
          </div>
          <div className={`poisonBeans__grid ${turn === 'society' ? 'is-disabled' : ''}`}>
            {beans.map((bean) => {
              const revealedPoison = (phase === 'won' || phase === 'lost') && bean.id === poison;
              return (
                <button
                  key={bean.id}
                  className={`poisonBean ${bean.eaten ? 'is-eaten' : ''} ${revealedPoison ? 'is-poison' : ''}`}
                  style={{ background: revealedPoison ? '#ef4444' : bean.eaten ? '#334155' : bean.color }}
                  onClick={() => eat(bean.id)}
                  disabled={bean.eaten || turn !== 'player' || phase !== 'playing'}
                  aria-label={`Bean ${bean.id + 1}`}
                />
              );
            })}
          </div>
          <div className={`poisonBeans__message ${phase === 'won' ? 'is-won' : ''} ${phase === 'lost' ? 'is-lost' : ''}`}>{message}</div>
          {(phase === 'won' || phase === 'lost') && <button className="phoneAction" onClick={start}>PLAY AGAIN</button>}
        </>
      )}
    </div>
  );
}
