import { missionContent } from '../lib/missionContent';

export default function MissionCompleteModal({
  missionNumber,
  missionsCompleted,
  onContinue,
}: {
  missionNumber: number;
  missionsCompleted: number;
  onContinue: () => void;
}) {
  const content = missionContent(missionNumber);
  return (
    <div className="modal">
      <div className="brief cq-complete">
        <div className="kicker">✓ MISSION COMPLETE</div>
        <h1>{content.title}</h1>
        <p>{content.celebration}</p>

        <div className="cq-complete-section">
          <b>SKILLS UNLOCKED</b>
          <ul>
            {content.skills.map((s) => (
              <li key={s}>✓ {s}</li>
            ))}
          </ul>
        </div>

        <div className="cq-complete-section">
          <b>BADGE EARNED</b>
          <div className="cq-badge">{content.badge}</div>
        </div>

        <div className="cq-complete-count">{missionsCompleted} / 4 MISSIONS COMPLETE</div>

        <button className="primary" onClick={onContinue}>CONTINUE QUEST</button>
      </div>
    </div>
  );
}
