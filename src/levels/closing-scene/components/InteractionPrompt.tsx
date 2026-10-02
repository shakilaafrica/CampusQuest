import './InteractionPrompt.css';

interface Props {
  left: string; // CSS position, e.g. "42%"
  top: string;
  label?: string;
}

export function InteractionPrompt({ left, top, label = 'Interact' }: Props) {
  return (
    <div className="interaction-prompt" style={{ left, top }}>
      <span className="interaction-prompt__key">E</span>
      <span className="interaction-prompt__label">{label}</span>
    </div>
  );
}
