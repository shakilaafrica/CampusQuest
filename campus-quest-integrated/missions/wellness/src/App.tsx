import { useState } from 'react';
import { StudentWellnessServicesWanted } from './missions/StudentWellnessServicesWanted';
import './App.css';

type View = 'mission' | 'map';

/**
 * Standalone demo harness — this is NOT part of Campus Quest's real app
 * shell. It exists so this mission can be run and tested on its own. In the
 * real game, the mission component slots in wherever the map level launches
 * it, and onMissionComplete should write into real progress state instead
 * of being a no-op.
 */
export default function App() {
  const [view, setView] = useState<View>('mission');

  return (
    <div className="app">
      {view === 'mission' && (
        <StudentWellnessServicesWanted onMissionComplete={() => {}} onExitToMap={() => setView('map')} />
      )}

      {view === 'map' && (
        <div className="app__map-placeholder">
          <h1>UCT Upper Campus Map</h1>
          <p>The rest of Campus Quest slots in here — map navigation and the other missions.</p>
        </div>
      )}
    </div>
  );
}
