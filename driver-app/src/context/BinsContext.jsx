import { createContext, useContext, useState, useEffect } from 'react';
import { onSnapshot, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { driver as mockDriver, routeSummary as mockRouteSummary } from '../data/mockData';

const BinsContext = createContext(null);

export function BinsProvider({ children }) {
  const [bins,         setBins]         = useState([]);
  const [driver,       setDriver]       = useState(mockDriver);
  const [routeSummary, setRouteSummary] = useState(mockRouteSummary);
  const [loading,      setLoading]      = useState(true);

  const driverId = localStorage.getItem('driver_id');

  // ── Load driver doc ────────────────────────────────────────────
  useEffect(() => {
    if (!driverId) return;
    const unsub = onSnapshot(doc(db, 'drivers', driverId), snap => {
      if (snap.exists()) setDriver({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [driverId]);

  // ── Fetch all bins from 'bins' collection ──────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bins'), snap => {
      setBins(snap.docs.map(d => {
        const data = d.data();
        const rawPriority = data.status === 'done'
          ? 'DONE'
          : (data.priority ?? 'MEDIUM').toString().toUpperCase();
        return {
          id:            d.id,
          name:          data.location    ?? data.name     ?? 'Unnamed Bin',
          area:          data.areaType    ?? data.area     ?? 'Unknown Area',
          fillLevel:     data.fillLevel   ?? 0,
          priority:      rawPriority,
          distance:      data.distance    ?? 0,
          stopNumber:    data.stopNumber  ?? 0,
          capacity:      data.capacity    ?? '',
          lastCollected: data.lastCollected ?? null,
          collectedAt:   data.collectedAt  ?? null,
          location:      data.location    ?? null,
        };
      }));
      setLoading(false);
    }, err => {
      console.error('Bins listener error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Mark bin collected ─────────────────────────────────────────
  async function markCollected(binId) {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setBins(prev => prev.map(b =>
      b.id === binId && b.priority !== 'DONE'
        ? { ...b, priority: 'DONE', collectedAt: now, lastCollected: now }
        : b
    ));
    try {
      await updateDoc(doc(db, 'bins', binId), {
        priority:      'DONE',
        collectedAt:   now,
        lastCollected: now,
      });
    } catch (err) {
      console.error('Failed to update bin:', err);
    }
  }

  const collectedBins   = bins.filter(b => b.priority === 'DONE');
  const collectedCount  = collectedBins.length;
  const total           = bins.length;
  const distanceCovered = collectedBins.reduce((sum, b) => sum + (b.distance ?? 0), 0).toFixed(1);

  return (
    <BinsContext.Provider value={{
      bins, loading,
      markCollected,
      collectedCount, total, distanceCovered,
      driver, routeSummary,
    }}>
      {children}
    </BinsContext.Provider>
  );
}

export const useBins = () => useContext(BinsContext);
