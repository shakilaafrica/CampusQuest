import { useEffect, useRef, useState } from 'react';
import { useKeyPress } from '../hooks/useKeyboard';
import './DialogueBox.css';

export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string; // emoji stand-in for a portrait sprite
}

interface Props {
  lines: DialogueLine[];
  onComplete: () => void;
}

const TYPE_SPEED_MS = 16;

export function DialogueBox({ lines, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const line = lines[index];
  // onComplete must fire once only — a fast double E-press (or E + click) can
  // land before the parent has unmounted this box.
  const completedRef = useRef(false);

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const full = line.text;
    const timer = window.setInterval(() => {
      i += 1;
      setDisplayed(full.slice(0, i));
      if (i >= full.length) window.clearInterval(timer);
    }, TYPE_SPEED_MS);
    return () => window.clearInterval(timer);
  }, [index, line.text]);

  const advance = () => {
    if (displayed.length < line.text.length) {
      setDisplayed(line.text); // let a press skip the typewriter first
      return;
    }
    if (index < lines.length - 1) {
      setIndex((i) => i + 1);
    } else {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }
  };

  useKeyPress('e', advance);

  return (
    <div className="dialogue-box" onClick={advance} role="button" tabIndex={0}>
      <div className="dialogue-box__portrait" aria-hidden="true">
        {line.portrait ?? '🧑'}
      </div>
      <div className="dialogue-box__body">
        <div className="dialogue-box__speaker">{line.speaker}</div>
        <p className="dialogue-box__text">{displayed}</p>
        <div className="dialogue-box__hint">Press E to continue</div>
      </div>
    </div>
  );
}
