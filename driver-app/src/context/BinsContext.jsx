import { createContext, useContext, useState } from 'react';
import { bins as initialBins, driver, routeSummary } from '../data/mockData';

const BinsContext = createContext(null);

export function BinsProvider({ children }) {
  const [bins, setBins] = useState(initialBins);

  function markCollected(binId) {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setBins(prev => prev.map(b =>
      b.id === binId && b.priority !== 'DONE'
        ? { ...b, priority: 'DONE', collectedAt: now, lastCollected: now }
        : b
    ));
  }

  const collectedBins   = bins.filter(b => b.priority === 'DONE');
  const collectedCount  = collectedBins.length;
  const total           = bins.length;
  const distanceCovered = collectedBins.reduce((sum, b) => sum + b.distance, 0).toFixed(1);

  return (
    <BinsContext.Provider value={{ bins, markCollected, collectedCount, total, distanceCovered, driver, routeSummary }}>
      {children}
    </BinsContext.Provider>
  );
}

export const useBins = () => useContext(BinsContext);
