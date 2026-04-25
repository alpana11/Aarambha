import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Truck, Trash2, Map } from 'lucide-react';
import { useBins } from '../context/BinsContext';
import { showToast }    from '../components/Toast';
import { confirmDialog } from '../components/ConfirmDialog';

const TABS = [
  { key: 'route', label: 'Route', Icon: Truck       },
  { key: 'bins',  label: 'Bins',  Icon: Trash2      },
  { key: 'map',   label: 'Map',   Icon: Map         },
  { key: 'done',  label: 'Done',  Icon: CheckCircle },
];

const PRIORITY_COLOR  = { HIGH: '#ef4444', MEDIUM: '#f59e0b', DONE: '#16a34a' };
const PRIORITY_BG     = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', DONE: '#f0fdf4' };
const PRIORITY_REASON = {
  HIGH:   'Fill level > 85% — immediate collection needed',
  MEDIUM: 'Fill level 60–85% — collect on route',
  DONE:   'Already collected this shift',
};

// Fill bar colour: green → yellow → red as level rises
function fillColor(pct) {
  if (pct >= 85) return '#ef4444';
  if (pct >= 60) return '#f59e0b';
  return '#16a34a';
}

export default function BinDetailScreen() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { bins, markCollected } = useBins();

  const bin = bins.find(b => b.id === id);
  if (!bin) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Bin not found</div>;

  const isDone      = bin.priority === 'DONE';
  const accentColor = PRIORITY_COLOR[bin.priority] ?? '#6b7280';
  const accentBg    = PRIORITY_BG[bin.priority]    ?? '#f9fafb';

  async function handleMarkCollected() {
    if (isDone) { showToast('Already collected', 'info'); return; }
    const confirmed = await confirmDialog({
      title:   `Collect ${bin.name}?`,
      message: 'Confirm that you have emptied this bin and are ready to mark it as collected.',
      sub:     `Fill level: ${bin.fillLevel}% · ${bin.area}`,
    });
    if (!confirmed) return;
    markCollected(bin.id);
    showToast('Bin marked as collected!', 'success');
    setTimeout(() => navigate('/main'), 800);
  }

  async function handleReportIssue() {
    const confirmed = await confirmDialog({
      title:   'Report an Issue?',
      message: 'This will notify your supervisor. Continue?',
      sub:     bin.name,
    });
    if (confirmed) showToast('Issue reported to officer', 'info');
  }

  const details = [
    { lbl: 'Distance',       val: bin.distance > 0 ? `${bin.distance} km away` : '—' },
    { lbl: 'Last collected', val: bin.lastCollected ?? '—' },
    { lbl: 'Area type',      val: bin.area          },
    { lbl: 'Bin ID',         val: bin.id            },
    { lbl: 'Capacity',       val: bin.capacity || '—' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f1f8f4', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ background: '#f1f8f4', padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => navigate('/main')}
          className="tap"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}
          aria-label="Back"
        >
          <ArrowLeft size={20} color="#374151" strokeWidth={2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{bin.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{bin.area} · Stop {bin.stopNumber}</div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>

        {/* Content card — gives sections a lifted, inset feel */}
        <div style={{ background: 'white', borderRadius: 16, padding: '16px 16px 8px', marginBottom: 16, border: '1px solid #f0f0f0' }}>

          {/* Priority strip */}
          <div style={{
            background: accentBg,
            border: `1px solid ${accentColor}33`,
            borderLeft: `3px solid ${accentColor}`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {bin.priority === 'HIGH'   && <AlertTriangle size={15} color={accentColor} strokeWidth={2} />}
            {bin.priority === 'MEDIUM' && <Clock         size={15} color={accentColor} strokeWidth={2} />}
            {bin.priority === 'DONE'   && <CheckCircle   size={15} color={accentColor} strokeWidth={2} />}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {bin.priority} Priority
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{PRIORITY_REASON[bin.priority]}</div>
            </div>
          </div>

          {/* Fill level */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fill Level</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: fillColor(bin.fillLevel), lineHeight: 1 }}>{bin.fillLevel}%</span>
            </div>
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${bin.fillLevel}%`,
                background: fillColor(bin.fillLevel),
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Empty</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Full</span>
            </div>
          </div>

          {/* Details — borderless rows */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Details</div>
            {details.map(({ lbl, val }, i) => (
              <div key={lbl} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: i === 0 ? 0 : 10,
                paddingBottom: 10,
                borderBottom: i < details.length - 1 ? '1px solid #f3f9f5' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{lbl}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button className="tap-btn" style={btnPrimary} onClick={handleMarkCollected}>
          <CheckCircle size={17} color="white" strokeWidth={2} />
          {isDone ? 'Already Collected' : 'Mark as Collected'}
        </button>

        <button className="tap-btn" style={btnOutline} onClick={handleReportIssue}>
          Report Issue
        </button>

        <button className="tap" style={btnGhost} onClick={() => navigate('/main')}>
          ← Back to Route
        </button>

        <div style={{ height: 16 }} />
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{
        flexShrink: 0, height: 56, display: 'flex',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -1px 0 #e5e7eb, 0 -4px 12px rgba(0,0,0,0.06)',
      }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = key === 'route';
          const color  = active ? '#16a34a' : '#9ca3af';
          return (
            <button
              key={key}
              onClick={() => navigate('/main', { state: { tab: key } })}
              style={{
                flex: 1, height: '100%', position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 2.5, borderRadius: '0 0 3px 3px',
                background: active ? '#16a34a' : 'transparent',
              }} />
              <Icon size={21} color={color} strokeWidth={2} style={{ transition: 'color 0.2s' }} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color, lineHeight: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const btnPrimary = {
  width: '100%', minHeight: 52, borderRadius: 14, border: 'none',
  fontSize: 15, fontWeight: 700, background: '#16a34a', color: 'white',
  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};
const btnOutline = {
  width: '100%', minHeight: 44, borderRadius: 12,
  border: '1.5px solid #d1d5db', fontSize: 14, fontWeight: 500,
  background: 'transparent', color: '#374151',
  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const btnGhost = {
  width: '100%', minHeight: 40, borderRadius: 10, border: 'none',
  fontSize: 13, fontWeight: 500, background: 'transparent', color: '#9ca3af',
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
