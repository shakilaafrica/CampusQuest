export default function IntroModal({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="modal">
      <div className="brief cq-intro">
        <div className="kicker">WELCOME TO CAMPUS QUEST</div>
        <h1>Your orientation adventure starts now.</h1>
        <p>
          Campus might seem huge at first — but every SciKnight has to start somewhere.
        </p>
        <p>
          Four missions are waiting for you across campus. Complete each one to discover
          important places, learn essential student skills, and prove you're ready for
          university life.
        </p>
        <p className="cq-intro-title">
          Complete all four missions to earn your title: <b>SCIKNIGHT</b>
        </p>
        <button className="primary" onClick={onBegin}>BEGIN QUEST</button>
      </div>
    </div>
  );
}
