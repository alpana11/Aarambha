import { useState, useEffect, useRef } from 'react';
import { useBins } from '../context/BinsContext';
import ProgressBar from '../components/ProgressBar';
import RouteTab from '../tabs/RouteTab';
import BinsTab from '../tabs/BinsTab';
import MapTab from '../tabs/MapTab';
import DoneTab from '../tabs/DoneTab';

const TABS = [
  { key: 'route', label: 'Route' },
  { key: 'bins',  label: 'Bins'  },
  { key: 'map',   label: 'Map'   },
  { key: 'done',  label: 'Done'  },
];

function getTime() {
  const now  = new Date();
  let h      = now.getHours();
  const m    = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState('route');
  const [prevTab,   setPrevTab]   = useState(null);
  const [time,      setTime]      = useState(getTime());
  const { bins, collectedCount, total, distanceCovered, driver, routeSummary } = useBins();

  // Real-time clock — ticks every second
  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  function switchTab(key) {
    if (key === activeTab) return;
    setPrevTab(activeTab);
    setActiveTab(key);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 700, background: '#f3f4f6' }}>

      {/* Status bar */}
      <div style={{ background: '#1a3a2a', padding: '10px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={statusText}>{time}</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />)}
        </div>
        <span style={statusText}>GPS On</span>
      </div>

      {/* Header */}
      <div style={{ background: '#1e4d35', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'white' }}>{driver.name}</div>
            <div style={{ fontSize: 12, color: '#86efac' }}>Truck #{driver.truckNumber} · {driver.zone}</div>
          </div>
          <div style={{ background: '#15803d', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#bbf7d0', fontWeight: 500 }}>
            On Shift
          </div>
        </div>
        <ProgressBar collected={collectedCount} total={total} />
      </div>

      {/* Nav tabs — 44px min height */}
      <div style={{ display: 'flex', background: '#16a34a' }}>
        {TABS.map(({ key, label }) => (
          <div
            key={key}
            role="button"
            onClick={() => switchTab(key)}
            style={{
              flex: 1, textAlign: 'center',
              minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, cursor: 'pointer', transition: 'color 0.2s, background 0.2s',
              color:        activeTab === key ? 'white' : '#bbf7d0',
              borderBottom: activeTab === key ? '2px solid white' : '2px solid transparent',
              background:   activeTab === key ? '#15803d' : 'transparent',
              userSelect: 'none',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Tab panels — all mounted, animated with CSS class */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {TABS.map(({ key }) => (
          <div
            key={key}
            className={activeTab === key ? 'tab-enter' : 'tab-exit'}
            style={{
              position:  activeTab === key ? 'relative' : 'absolute',
              inset:     0,
              // active tab is in flow; inactive tabs are pulled out of flow but kept mounted
              visibility: activeTab === key ? 'visible' : 'hidden',
              pointerEvents: activeTab === key ? 'auto' : 'none',
            }}
          >
            {key === 'route' && <RouteTab bins={bins} />}
            {key === 'bins'  && <BinsTab  bins={bins} />}
            {key === 'map'   && <MapTab   bins={bins} collectedCount={collectedCount} total={total} routeSummary={routeSummary} driver={driver} />}
            {key === 'done'  && <DoneTab  bins={bins} collectedCount={collectedCount} distanceCovered={distanceCovered} driver={driver} />}
          </div>
        ))}
      </div>
    </div>
  );
}

const statusText = { color: '#a0d4b0', fontSize: 11, fontWeight: 500 };
