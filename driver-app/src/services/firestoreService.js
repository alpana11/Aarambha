import {
  collection, doc,
  getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Collection references ──────────────────────────────────────────
const driversCol     = collection(db, 'drivers');
const driverBinsCol  = collection(db, 'driverBins');  // renamed — avoids clash with existing 'bins'
const routesCol      = collection(db, 'routes');
const shiftsCol      = collection(db, 'shifts');
const collectionsCol = collection(db, 'collections'); // bin collection events / audit log
const issuesCol      = collection(db, 'issues');

// ── drivers ───────────────────────────────────────────────────────
export async function getDriver(driverId) {
  const snap = await getDoc(doc(driversCol, driverId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getDriverByCollectorId(collectorId) {
  const q    = query(driversCol, where('collectorId', '==', collectorId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ── driverBins ────────────────────────────────────────────────────
export async function getBinsForRoute(routeId) {
  const q    = query(driverBinsCol, where('routeId', '==', routeId), orderBy('stopNumber'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateBinPriority(binId, priority, collectedAt = null) {
  const data = { priority };
  if (collectedAt) data.collectedAt = collectedAt;
  await updateDoc(doc(driverBinsCol, binId), data);
}

// ── routes ────────────────────────────────────────────────────────
export async function getRoute(routeId) {
  const snap = await getDoc(doc(routesCol, routeId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getActiveRouteForDriver(driverId) {
  const q    = query(routesCol, where('driverId', '==', driverId), where('status', '==', 'active'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ── shifts ────────────────────────────────────────────────────────
export async function getActiveShift(driverId) {
  const q    = query(shiftsCol, where('driverId', '==', driverId), where('status', '==', 'active'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function startShift(driverId, routeId) {
  const ref = await addDoc(shiftsCol, {
    driverId,
    routeId,
    startTime:       serverTimestamp(),
    endTime:         null,
    status:          'active',
    distanceCovered: 0,
    binsCollected:   0,
  });
  return ref.id;
}

export async function endShift(shiftId, distanceCovered, binsCollected) {
  await updateDoc(doc(shiftsCol, shiftId), {
    endTime:         serverTimestamp(),
    status:          'completed',
    distanceCovered,
    binsCollected,
  });
}

// ── collections (audit log) ───────────────────────────────────────
export async function logCollection(binId, driverId, shiftId, fillLevelAtCollection) {
  await addDoc(collectionsCol, {
    binId,
    driverId,
    shiftId,
    fillLevelAtCollection,
    collectedAt: serverTimestamp(),
  });
}

// ── issues ────────────────────────────────────────────────────────
export async function reportIssue(binId, driverId, shiftId, description = '') {
  await addDoc(issuesCol, {
    binId,
    driverId,
    shiftId,
    description,
    status:     'open',
    reportedAt: serverTimestamp(),
  });
}
