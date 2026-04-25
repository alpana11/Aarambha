import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDd_MF2vGDe8HsLwX3fTu7rP41WVgOnipA',
  authDomain:        'swachhmitraai-c3721.firebaseapp.com',
  projectId:         'swachhmitraai-c3721',
  storageBucket:     'swachhmitraai-c3721.firebasestorage.app',
  messagingSenderId: '323033084407',
  appId:             '1:323033084407:web:7d894bbb47cb5526d93ef2',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function seed() {

  // 1. drivers
  await setDoc(doc(db, 'drivers', 'DRV-001'), {
    collectorId: 'COL-042',
    name:        'Ravi Kumar',
    truckNumber: 'T-07',
    zone:        'Zone B',
    area:        'Market Area · Ward 12',
    shiftStart:  '07:30 AM',
    pin:         '1234',
  });
  console.log('✓ drivers');

  // 2. driverBins
  const bins = [
    { id: 'BIN-041', routeId: 'ROUTE-001', name: 'Subhash Nagar #1',     area: 'Residential', priority: 'DONE',   fillLevel: 100, distance: 0.4, stopNumber: 1, capacity: '240L', lastCollected: '08:10 AM', collectedAt: '08:10 AM' },
    { id: 'BIN-042', routeId: 'ROUTE-001', name: 'Bus Stand Bin #2',      area: 'Transit Hub',  priority: 'DONE',   fillLevel: 95,  distance: 0.6, stopNumber: 2, capacity: '360L', lastCollected: '08:47 AM', collectedAt: '08:47 AM' },
    { id: 'BIN-043', routeId: 'ROUTE-001', name: 'Market Square Bin #03', area: 'Market Area',  priority: 'HIGH',   fillLevel: 92,  distance: 0.3, stopNumber: 3, capacity: '240L', lastCollected: '08:30 AM', collectedAt: null },
    { id: 'BIN-044', routeId: 'ROUTE-001', name: 'Patel Nagar Stop #1',   area: 'Residential',  priority: 'HIGH',   fillLevel: 88,  distance: 0.7, stopNumber: 4, capacity: '120L', lastCollected: '07:15 AM', collectedAt: null },
    { id: 'BIN-045', routeId: 'ROUTE-001', name: 'City Park Bin #A',      area: 'Park Area',    priority: 'MEDIUM', fillLevel: 71,  distance: 1.2, stopNumber: 5, capacity: '240L', lastCollected: '06:45 AM', collectedAt: null },
    { id: 'BIN-046', routeId: 'ROUTE-001', name: 'Office Complex #B2',    area: 'Office Zone',  priority: 'MEDIUM', fillLevel: 68,  distance: 1.8, stopNumber: 6, capacity: '480L', lastCollected: '07:00 AM', collectedAt: null },
    { id: 'BIN-047', routeId: 'ROUTE-001', name: 'Gandhi Chowk Bin #5',   area: 'Market Area',  priority: 'MEDIUM', fillLevel: 65,  distance: 2.1, stopNumber: 7, capacity: '240L', lastCollected: '06:30 AM', collectedAt: null },
  ];
  for (const { id, ...data } of bins) {
    await setDoc(doc(db, 'driverBins', id), data);
  }
  console.log('✓ driverBins');

  // 3. routes
  await setDoc(doc(db, 'routes', 'ROUTE-001'), {
    driverId:            'DRV-001',
    date:                '2025-01-01',
    status:              'active',
    totalDistance:       6.1,
    optimizedDistance:   3.8,
    savedDistance:       2.3,
    estimatedCompletion: '11:52 AM',
  });
  console.log('✓ routes');

  // 4. shifts
  await setDoc(doc(db, 'shifts', 'SHIFT-001'), {
    driverId:        'DRV-001',
    routeId:         'ROUTE-001',
    status:          'active',
    startTime:       '07:30 AM',
    endTime:         null,
    distanceCovered: 1.0,
    binsCollected:   2,
  });
  console.log('✓ shifts');

  // 5. collections (audit log)
  await addDoc(collection(db, 'collections'), {
    binId: 'BIN-041', driverId: 'DRV-001', shiftId: 'SHIFT-001',
    fillLevelAtCollection: 100, collectedAt: '08:10 AM',
  });
  await addDoc(collection(db, 'collections'), {
    binId: 'BIN-042', driverId: 'DRV-001', shiftId: 'SHIFT-001',
    fillLevelAtCollection: 95, collectedAt: '08:47 AM',
  });
  console.log('✓ collections');

  // 6. issues
  await addDoc(collection(db, 'issues'), {
    binId: 'BIN-043', driverId: 'DRV-001', shiftId: 'SHIFT-001',
    description: 'Bin lid broken', status: 'open', reportedAt: '08:30 AM',
  });
  console.log('✓ issues');

  console.log('\n✅ All collections seeded!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
