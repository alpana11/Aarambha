import { createContext, useContext, useState, useEffect } from 'react';
import { onSnapshot, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { driver as mockDriver, routeSummary as mockRouteSummary } from '../data/mockData';

const BinsContext = createContext(null);

const DEMO_POS = { lat: 28.6139, lng: 77.2090 };

function calcPriority(fillLevel, status) {
  if (status === 'empty') return 'DONE';
  if (status === 'full'  || fillLevel >= 85) return 'HIGH';
  if (status === 'medium' || fillLevel >= 60) return 'MEDIUM';
  return 'LOW';
}

function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Greedy nearest-neighbour route starting from a given position
function nearestNeighbourRoute(start, bins) {
  const remaining = [...bins];
  const route     = [];
  let   current   = start;
  while (remaining.length > 0) {
    let nearestIdx  = 0;
    let nearestDist = Infinity;
    remaining.forEach((b, i) => {
      if (b.lat == null || b.lng == null) return;
      const d = haversine(current.lat, current.lng, b.lat, b.lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });
    const next = remaining.splice(nearestIdx, 1)[0];
    route.push({
      ...next,
      distance: parseFloat(
        haversine(current.lat, current.lng, next.lat ?? current.lat, next.lng ?? current.lng).toFixed(1)
      ),
    });
    current = { lat: next.lat ?? current.lat, lng: next.lng ?? current.lng };
  }
  return route;
}

export function BinsProvider({ children }) {
  const [rawBins,      setRawBins]      = useState([]);
  const [bins,         setBins]         = useState([]);
  const [fullBins,     setFullBins]     = useState([]);
  const [driver,       setDriver]       = useState({ ...mockDriver, isOnline: true });
  const [routeSummary, setRouteSummary] = useState(mockRouteSummary);
  const [loading,      setLoading]      = useState(true);

  const driverId = localStorage.getItem('driver_id');

  // ── Load driver doc ────────────────────────────────────────────
  useEffect(() => {
    if (!driverId) return;
    const unsub = onSnapshot(doc(db, 'drivers', driverId), snap => {
      if (snap.exists()) setDriver({ isOnline: true, id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [driverId]);

  // ── Listen to 'bins' collection — filter full, nearest-neighbour sorted ──
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bins'), snap => {
      const raw = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));

      // Full bins: status === 'full'
      const full = raw.filter(b => b.status === 'full');
      setFullBins(nearestNeighbourRoute(DEMO_POS, full));

      // All bins mapped for the main UI
      setRawBins(raw.map(d => {
        const priority = calcPriority(d.fillLevel ?? 0, d.status);
        return {
          _docId:        d._docId,                      // Firestore document ID — used for updateDoc
          id:            d.id ?? d._docId,              // bin.id field (BIN-004) from document data
          name:          d.location      ?? d.name ?? 'Unnamed Bin',
          area:          d.areaType      ?? d.area ?? 'Unknown Area',
          fillLevel:     d.fillLevel     ?? 0,
          status:        d.status        ?? 'empty',
          priority,
          firestoreDist: d.distance      ?? null,
          stopNumber:    d.stopNumber    ?? 0,
          capacity:      d.capacity      ?? '',
          lastCollected: d.lastCollected ?? null,
          collectedAt:   d.collectedAt   ?? null,
          location:      d.location      ?? null,
          lat:           d.lat           ?? null,
          lng:           d.lng           ?? null,
        };
      }));
      setLoading(false);
    }, err => {
      console.error('Bins listener error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Calculate distances from fixed demo position ───────────────
  useEffect(() => {
    setBins(rawBins.map(b => ({
      ...b,
      distance: b.lat && b.lng
        ? parseFloat(haversine(DEMO_POS.lat, DEMO_POS.lng, b.lat, b.lng).toFixed(1))
        : (b.firestoreDist ?? 0),
    })));
  }, [rawBins]);

  // ── Mark bin collected ─────────────────────────────────────────
  async function markCollected(binId) {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Optimistic update
    setBins(prev => prev.map(b =>
      b.id === binId && b.priority !== 'DONE'
        ? { ...b, priority: 'DONE', status: 'empty', fillLevel: 0, collectedAt: now, lastCollected: now }
        : b
    ));

    // Find the Firestore doc ID for this bin
    const bin = bins.find(b => b.id === binId);
    const docId = bin?._docId ?? binId;

    try {
      await updateDoc(doc(db, 'bins', docId), {
        status:        'empty',
        fillLevel:     0,
        priority:      'Low',
        collectedAt:   now,
        lastCollected: now,
        lastUpdated:   now,
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
      bins, loading, fullBins,
      markCollected,
      collectedCount, total, distanceCovered,
      driver, routeSummary,
    }}>
      {children}
    </BinsContext.Provider>
  );
}

export const useBins = () => useContext(BinsContext);
