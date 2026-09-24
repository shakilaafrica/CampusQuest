import { useState } from 'react';
import { OperationStudentCard } from './missions/OperationStudentCard';
import type { InventoryItem } from './types/game';
import './App.css';

/**
 * Standalone demo harness — this is NOT part of Campus Quest's real app shell.
 * It exists so "Operation: Student Card" can be run and tested on its own.
 * In the real game, <OperationStudentCard /> slots in wherever the map level
 * launches a mission, and onMissionComplete should write into the real
 * player/inventory state instead of this local useState.
 */
export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [missionActive, setMissionActive] = useState(true);

  return (
    <div className="app">
      <div className="app__inventory">
        <span className="app__inventory-label">Inventory</span>
        {inventory.length === 0 && <span className="app__inventory-empty">Empty</span>}
        {inventory.map((item) => (
          <span key={item.id} className="app__inventory-item" title={item.description}>
            {item.icon} {item.name}
          </span>
        ))}
      </div>

      {missionActive ? (
        <OperationStudentCard
          onMissionComplete={(item) => setInventory((inv) => [...inv, item])}
          onExitToMap={() => setMissionActive(false)}
        />
      ) : (
        <div className="app__map-placeholder">
          <h1>UCT Upper Campus Map</h1>
          <p>The rest of Campus Quest slots in here — map navigation and the remaining three missions.</p>
        </div>
      )}
    </div>
  );
}
