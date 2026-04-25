import { useParams, useNavigate } from 'react-router-dom';
import { useBins } from '../context/BinsContext';
import FillLevelBar from '../components/FillLevelBar';
import StatusBadge from '../components/StatusBadge';
import { showToast } from '../components/Toast';
import { confirmDialog } from '../components/ConfirmDialog';

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', DONE: '#16a34a' };
const PRIORITY_REASON = {
  HIGH:   'Fill level > 85% — immediate collection needed',
  MEDIUM: 'Fill level 60–85% — collect on route',
  DONE:   'Already collected this shift',
};

export default function BinDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bins, markCollected } = useBins();

  const bin = bins.find(b => b.id === id);
  if (!bin) return <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Bin not found</div>;

  const borderColor = PRIORITY_COLOR[bin.priority] ?? '#6b7280';

  async function handleMarkCollected() {
    if (bin.priority === 'DONE') {
      showToast('Already collected', 'info');
      return;
    }

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
    { lbl: 'Last collected', val: bin.lastCollected },
    { lbl: 'Area type',      val: bin.area          },
    { lbl: 'Bin ID',         val: bin.id            },
    { lbl: 'Capacity',       val: bin.capacity      },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 700, background: '#f3f4f6' }}>

      {/* Status bar */}
      <div style={{ background: '#1a3a2a', padding: '10px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={statusText}>SwachhMitra</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />)}
        </div>
        <span style={statusText}>GPS On</span>
      </div>

      {/* Header — back button is 44×44 tap target */}
      <div style={{ background: '#1e4d35', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 4, minHeight: 52 }}>
        <button
          onClick={() => navigate('/main')}
          style={{ background: 'none', border: 'none', color: '#86efac', fontSize: 20, cursor: 'pointer', padding: 0, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Back"
        >
          ←
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'white' }}>{bin.name}</div>
          <div style={{ fontSize: 11, color: '#86efac' }}>{bin.area} · Stop #{bin.stopNumber}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>

        {/* Priority card */}
        <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderLeft: `3px solid ${borderColor}`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Priority Level</div>
            <StatusBadge priority={bin.priority} />
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{PRIORITY_REASON[bin.priority]}</div>
        </div>

        {/* Fill level card */}
        <div style={card}>
          <div style={cardTitle}>Fill level</div>
          <FillLevelBar fill={bin.fillLevel} />
        </div>

        {/* Details card */}
        <div style={card}>
          <div style={cardTitle}>Details</div>
          {details.map(({ lbl, val }, i) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, borderBottom: i < details.length - 1 ? '0.5px solid #f3f4f6' : 'none' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Action buttons — all minHeight 44px */}
        <button style={btnPrimary}   onClick={handleMarkCollected}>Mark as Collected</button>
        <button style={btnSecondary} onClick={handleReportIssue}>Report Issue</button>
        <button style={btnSecondary} onClick={() => navigate('/main')}>Back to Route</button>
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}

const statusText   = { color: '#a0d4b0', fontSize: 11, fontWeight: 500 };
const card         = { background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 10 };
const cardTitle    = { fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 4 };
const btnPrimary   = { width: '100%', minHeight: 44, padding: '11px 12px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 500, background: '#16a34a', color: 'white', cursor: 'pointer', marginTop: 8, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnSecondary = { width: '100%', minHeight: 44, padding: '11px 12px', borderRadius: 12, border: '0.5px solid #e5e7eb', fontSize: 14, fontWeight: 500, background: '#f3f4f6', color: '#374151', cursor: 'pointer', marginTop: 8, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' };
