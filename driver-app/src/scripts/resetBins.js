import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

// Reset bins to original state (only BIN-041 and BIN-042 are DONE by design)
const resets = [
  { id: 'BIN-041', priority: 'DONE',   collectedAt: '08:10 AM' },
  { id: 'BIN-042', priority: 'DONE',   collectedAt: '08:47 AM' },
  { id: 'BIN-043', priority: 'HIGH',   collectedAt: null },
  { id: 'BIN-044', priority: 'HIGH',   collectedAt: null },
  { id: 'BIN-045', priority: 'MEDIUM', collectedAt: null },
  { id: 'BIN-046', priority: 'MEDIUM', collectedAt: null },
  { id: 'BIN-047', priority: 'MEDIUM', collectedAt: null },
];

async function reset() {
  for (const { id, priority, collectedAt } of resets) {
    await updateDoc(doc(db, 'driverBins', id), { priority, collectedAt });
    console.log(`✓ ${id} → ${priority}`);
  }
  console.log('\n✅ Bins reset!');
  process.exit(0);
}

reset().catch(err => { console.error('❌', err); process.exit(1); });
