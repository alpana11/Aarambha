import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, Trash2, Map, CheckCircle, User, Bell } from 'lucide-react';
import { useBins } from '../context/BinsContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { showToast } from '../components/Toast';
import RouteTab from '../tabs/RouteTab';
import BinsTab from '../tabs/BinsTab';
import MapTab from '../tabs/MapTab';
import DoneTab from '../tabs/DoneTab';
import NotificationsTab from '../tabs/NotificationsTab';

const TABS = [
  { key: 'route', label: 'Route', Icon: Truck       },
  { key: 'bins',  label: 'Bins',  Icon: Trash2      },
  { key: 'map',   label: 'Map',   Icon: Map         },
  { key: 'done',  label: 'Done',  Icon: CheckCircle },
];

const NAV_TABS = TABS; // bottom nav only shows these 4

function getTime() {
  const now  = new Date();
  let h      = now.getHours();
  const m    = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function MainScreen() {
  const [activeTab,   setActiveTab]   = useState('route');
  const [time,        setTime]        = useState(getTime());
  const [profileOpen, setProfileOpen] = useState(false);
  const [focusedBin,  setFocusedBin]  = useState(null); // { id, lat, lng, name }
  const { bins, loading, fullBins, collectedCount, total, distanceCovered, driver, routeSummary } = useBins();

  const location = useLocation();

  // ── Toast when a new full bin appears ───────────────────────────
  const notifiedRef = useRef(new Set());
  useEffect(() => {
    fullBins.forEach(b => {
      if (notifiedRef.current.has(b.id)) return;
      notifiedRef.current.add(b.id);
      showToast(`🗑 ${b.name} is full — needs pickup`, 'error');
    });
    // Clear flag when bin is no longer full
    notifiedRef.current.forEach(id => {
      if (!fullBins.find(b => b.id === id)) notifiedRef.current.delete(id);
    });
  }, [fullBins]);

  // ── Keep driver online status in sync ─────────────────────────
  useEffect(() => {
    const driverId = localStorage.getItem('driver_id');
    if (!driverId) return;

    const driverRef = doc(db, 'drivers', driverId);
    const setOnline  = () => updateDoc(driverRef, { isOnline: true,  lastSeen: new Date().toISOString() });
    const setOffline = () => updateDoc(driverRef, { isOnline: false, lastSeen: new Date().toISOString() });

    setOnline();
    const interval = setInterval(() => updateDoc(driverRef, { lastSeen: new Date().toISOString() }), 30000);

    window.addEventListener('beforeunload', setOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, []);

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

          {/* Bell with badge */}
          <button
            onClick={() => setActiveTab('notifications')}
            style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          >
            <Bell size={16} color="#6b7280" strokeWidth={1.8} />
            {fullBins.length > 0 && (
              <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: '2px solid #f1f8f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>{fullBins.length}</span>
              </div>
            )}
          </button>
        </div>

        {/* Row 2: truck + area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Truck size={11} color="#9ca3af" strokeWidth={2} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {driver.truckNumber} · {driver.area ?? driver.zone}
          </span>
          <span style={{ fontSize: 11, color: '#d1d5db', marginLeft: 2 }}>·</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: driver.isOnline ? '#16a34a' : '#9ca3af', marginLeft: 2 }} />
          <span style={{ fontSize: 11, color: driver.isOnline ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
            {driver.isOnline ? 'On Shift' : 'Offline'}
          </span>
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

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ position: 'absolute', top: TOP_H, bottom: BOT_H, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f8f4', zIndex: 5 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #bbf7d0', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: '#6b7280' }}>Loading route...</div>
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="scroll-area" style={{ position: 'absolute', top: TOP_H, bottom: 0, left: 0, right: 0, overflowY: 'auto', overflowX: 'hidden', paddingBottom: BOT_H }}>
        {[...TABS, { key: 'notifications' }].map(({ key }) => (
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
            {key === 'route'         && <RouteTab         bins={bins} onNavigate={bin => { setFocusedBin(bin); setActiveTab('map'); }} />}
            {key === 'bins'          && <BinsTab          bins={bins} />}
            {key === 'map'           && <MapTab           bins={bins} collectedCount={collectedCount} total={total} routeSummary={routeSummary} focusedBin={focusedBin} onClearFocus={() => setFocusedBin(null)} />}
            {key === 'done'          && <DoneTab          bins={bins} collectedCount={collectedCount} distanceCovered={distanceCovered} driver={driver} />}
            {key === 'notifications' && <NotificationsTab />}
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
              { lbl: 'Truck',  val: `#${driver.truckNumber}`,                    green: false },
              { lbl: 'Zone',   val: driver.zone,                                  green: false },
              { lbl: 'Shift',  val: driver.shiftStart,                            green: false },
              { lbl: 'Status', val: driver.isOnline ? 'On Shift' : 'Offline',     green: driver.isOnline },
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
