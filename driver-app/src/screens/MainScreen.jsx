import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, Trash2, Map, CheckCircle, User, Bell } from 'lucide-react';
import { useBins } from '../context/BinsContext';
import RouteTab from '../tabs/RouteTab';
import BinsTab from '../tabs/BinsTab';
import MapTab from '../tabs/MapTab';
import DoneTab from '../tabs/DoneTab';

const TABS = [
  { key: 'route', label: 'Route', Icon: Truck        },
  { key: 'bins',  label: 'Bins',  Icon: Trash2       },
  { key: 'map',   label: 'Map',   Icon: Map          },
  { key: 'done',  label: 'Done',  Icon: CheckCircle  },
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
  const [activeTab,      setActiveTab]      = useState('route');
  const [time,           setTime]           = useState(getTime());
  const [profileOpen,    setProfileOpen]    = useState(false);
  const { bins, collectedCount, total, distanceCovered, driver, routeSummary } = useBins();

  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) setActiveTab(location.state.tab);
  }, [location.state]);

  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  function switchTab(key) {
    if (key === activeTab) return;
    setActiveTab(key);
  }

  // Fixed top section height: header (96px)
  // Fixed bottom nav height: 56px
  const TOP_H = 96;
  const BOT_H = 56;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f1f8f4' }}>

      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: '#f1f8f4',
        padding: '14px 16px 10px',
      }}>
        {/* Row 1: avatar · greeting+name · bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>

          {/* Avatar */}
          <button
            onClick={() => setProfileOpen(true)}
            className="tap"
            style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', border: '2px solid #86efac', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            aria-label="Profile"
          >
            <User size={18} color="#16a34a" strokeWidth={2} />
          </button>

          {/* Greeting + name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, lineHeight: 1.2 }}>{greeting},</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {driver.name}
            </div>
          </div>

          {/* Bell */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={16} color="#6b7280" strokeWidth={1.8} />
          </div>
        </div>

        {/* Row 2: truck + area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Truck size={11} color="#9ca3af" strokeWidth={2} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {driver.truckNumber} · {driver.area ?? driver.zone}
          </span>
          <span style={{ fontSize: 11, color: '#d1d5db', marginLeft: 2 }}>·</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', marginLeft: 2 }} />
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>On Shift</span>
        </div>

        {/* Row 3: progress bar */}
        <div style={{ height: 3, background: '#d4edda', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.round((collectedCount / total) * 100)}%`,
            background: '#16a34a',
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="scroll-area" style={{ position: 'absolute', top: TOP_H, bottom: 0, left: 0, right: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: BOT_H }}>
        {TABS.map(({ key }) => (
          <div
            key={key}
            className={activeTab === key ? 'tab-enter' : 'tab-exit'}
            style={{
              position:      activeTab === key ? 'relative' : 'absolute',
              inset:         0,
              visibility:    activeTab === key ? 'visible' : 'hidden',
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

      {/* ── Bottom navigation ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: BOT_H,
        display: 'flex',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -1px 0 #e5e7eb, 0 -4px 12px rgba(0,0,0,0.06)',
        zIndex: 10,
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          const color  = active ? '#16a34a' : '#9ca3af';
          return (
            <button
              key={key}
              onClick={() => switchTab(key)}
              style={{
                flex: 1, height: '100%', position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
              }}
            >
              {/* Active top-bar indicator */}
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 2.5, borderRadius: '0 0 3px 3px',
                background: active ? '#16a34a' : 'transparent',
                transition: 'background 0.2s',
              }} />
              <Icon
                size={21}
                color={color}
                strokeWidth={2}
                style={{ transition: 'color 0.2s' }}
              />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color, transition: 'color 0.2s', lineHeight: 1,
                letterSpacing: active ? 0.1 : 0,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Profile drawer ── */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', top: 100, right: 12, background: 'white', width: 210, borderRadius: 14, padding: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} color="#16a34a" strokeWidth={2} /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{driver.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Driver</div>
              </div>
            </div>
            {[
              { lbl: 'Truck',  val: `#${driver.truckNumber}`, green: false },
              { lbl: 'Zone',   val: driver.zone,              green: false },
              { lbl: 'Shift',  val: driver.shiftStart,        green: false },
              { lbl: 'Status', val: 'On Shift',               green: true  },
            ].map(({ lbl, val, green }) => (
              <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: green ? '#16a34a' : '#111827' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const statusText = { color: '#a0d4b0', fontSize: 11, fontWeight: 500 }; // kept for potential reuse
