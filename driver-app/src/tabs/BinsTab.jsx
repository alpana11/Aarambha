import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AlertCircle, Trash2, CheckCircle, Clock } from 'lucide-react';

const PRIORITY_ACCENT = { HIGH: '#ef4444', MEDIUM: '#f59e0b' };
const PRIORITY_BG     = { HIGH: '#fef2f2', MEDIUM: '#fffbeb' };
const PRIORITY_LABEL  = { HIGH: 'HIGH',    MEDIUM: 'MED'     };
const PRIORITY_BADGE  = {
  HIGH:   { background: '#fee2e2', color: '#991b1b' },
  MEDIUM: { background: '#fef9c3', color: '#854d0e' },
};

function PendingRow({ bin, isNext }) {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const isHigh   = bin.priority === 'HIGH';
  const accent   = PRIORITY_ACCENT[bin.priority] ?? '#6b7280';
  const rowBg    = pressed ? '#f9fafb' : isNext ? PRIORITY_BG[bin.priority] ?? 'white' : 'white';

  return (
    <div
      onClick={() => navigate(`/bin/${bin.id}`)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: rowBg,
        borderRadius: 12,
        border: `1px solid ${isNext ? accent + '55' : '#f0f0f0'}`,
        borderLeft: `3px solid ${accent}`,
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: isHigh ? '#fee2e2' : '#fef9c3',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isHigh
          ? <AlertCircle size={15} color="#dc2626" strokeWidth={2} />
          : <Trash2      size={15} color="#d97706" strokeWidth={2} />
        }
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bin.name}
          </span>
          {isNext && <span style={{ fontSize: 9, fontWeight: 700, color: accent, background: accent + '18', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>NEXT</span>}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          {bin.area} · {bin.distance} km · Stop #{bin.stopNumber}
        </div>
      </div>

      {/* Priority badge */}
      <span style={{
        ...PRIORITY_BADGE[bin.priority],
        fontSize: 10, fontWeight: 700,
        padding: '3px 7px', borderRadius: 20, flexShrink: 0,
      }}>
        {PRIORITY_LABEL[bin.priority] ?? bin.priority}
      </span>
    </div>
  );
}

function DoneRow({ bin }) {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={() => navigate(`/bin/${bin.id}`)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: pressed ? '#f3f4f6' : '#fafafa',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        borderLeft: '3px solid #86efac',
        padding: '9px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
        opacity: 0.82,
        transition: 'background 0.12s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: '#dcfce7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle size={14} color="#16a34a" strokeWidth={2.5} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {bin.name}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
          {bin.area}
        </div>
      </div>

      {/* Collected time */}
      {bin.collectedAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <Clock size={10} color="#9ca3af" strokeWidth={2} />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{bin.collectedAt}</span>
        </div>
      )}

      {/* Done badge */}
      <span style={{ fontSize: 10, fontWeight: 600, color: '#166534', background: '#dcfce7', padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>
        Done
      </span>
    </div>
  );
}

export default function BinsTab({ bins }) {
  const nextStopId = bins.find(b => b.priority !== 'DONE')?.id;
  const pending    = bins.filter(b => b.priority !== 'DONE');
  const done       = bins.filter(b => b.priority === 'DONE');

  return (
    <div style={{ padding: '12px 16px 20px', background: '#f3f4f6' }}>

      {/* ── Summary strip ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { val: pending.length, lbl: 'Pending',   color: '#d97706', bg: '#fffbeb' },
          { val: done.length,    lbl: 'Done',       color: '#16a34a', bg: '#f0fdf4' },
          { val: bins.length,    lbl: 'Total',      color: '#6b7280', bg: 'white'   },
        ].map(({ val, lbl, color, bg }) => (
          <div key={lbl} style={{ flex: 1, background: bg, borderRadius: 10, padding: '7px 8px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Pending section ── */}
      {pending.length > 0 && (
        <>
          <div style={sectionHeader}>
            <AlertCircle size={11} color="#d97706" strokeWidth={2.5} />
            Pending <span style={sectionCount}>{pending.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {pending.map(b => <PendingRow key={b.id} bin={b} isNext={b.id === nextStopId} />)}
          </div>
        </>
      )}

      {/* ── Done section ── */}
      {done.length > 0 && (
        <>
          <div style={{ ...sectionHeader, marginTop: 16 }}>
            <CheckCircle size={11} color="#16a34a" strokeWidth={2.5} />
            Completed <span style={sectionCount}>{done.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {done.map(b => <DoneRow key={b.id} bin={b} />)}
          </div>
        </>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}

const sectionHeader = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 11, fontWeight: 700, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  marginBottom: 8,
};
const sectionCount = {
  background: '#e5e7eb', color: '#6b7280',
  fontSize: 10, fontWeight: 700,
  padding: '1px 6px', borderRadius: 20, marginLeft: 2,
};
