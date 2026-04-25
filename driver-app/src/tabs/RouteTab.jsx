import { useNavigate } from 'react-router-dom';
import { Navigation, AlertTriangle, Clock, MapPin, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { showToast } from '../components/Toast';

export default function RouteTab({ bins }) {
  const navigate = useNavigate();
  const pending  = bins.filter(b => b.priority !== 'DONE');
  const nextStop = pending[0] ?? null;
  const upNext   = pending.slice(1);
  const kmLeft   = pending.reduce((s, b) => s + b.distance, 0).toFixed(1);
  const minEst   = Math.round(pending.length * 7.5);

  const isHigh   = nextStop?.priority === 'HIGH';
  const isMed    = nextStop?.priority === 'MEDIUM';
  const accent   = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#16a34a';

  return (
    <div style={{ padding: '8px 16px 20px', background: '#f3f4f6' }}>

      {/* ── Stats strip — lightweight, secondary ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { num: pending.length, lbl: 'Remaining' },
          { num: `${kmLeft} km`, lbl: 'Left'      },
          { num: `~${minEst}m`,  lbl: 'Est. time' },
        ].map(({ num, lbl }) => (
          <div key={lbl} style={{ flex: 1, background: 'white', borderRadius: 10, padding: '7px 6px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', lineHeight: 1 }}>{num}</div>
            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {nextStop ? (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 2 }}>
            Next Stop
          </div>

          {/* ── Hero card ── */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            marginBottom: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.09)',
            border: '1px solid #f0f0f0',
          }}>
            {/* Priority accent bar */}
            <div style={{ height: 4, background: accent }} />

            <div style={{ padding: '14px 16px 16px' }}>
              {/* Name + badge row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.2, flex: 1, marginRight: 10 }}>
                  {nextStop.name}
                </div>
                <StatusBadge priority={nextStop.priority} />
              </div>

              {/* Location row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <MapPin size={13} color="#9ca3af" strokeWidth={2} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>{nextStop.area}</span>
              </div>

              {/* Distance + stop number */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{nextStop.distance} km away</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Stop #{nextStop.stopNumber}</span>
              </div>

              {/* Priority callout — only when needed */}
              {isHigh && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 10px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} color="#dc2626" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>High priority — collect immediately</span>
                </div>
              )}
              {isMed && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} color="#d97706" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Medium priority</span>
                </div>
              )}

              {/* Navigate — primary CTA */}
              <button
                style={btnNavigate}
                onClick={() => showToast('Opening navigation...')}
              >
                <Navigation size={17} color="white" strokeWidth={2.5} />
                Navigate
              </button>

              {/* Details — ghost */}
              <button
                style={btnDetails}
                onClick={() => navigate(`/bin/${nextStop.id}`)}
              >
                View Details
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 15, color: '#16a34a', fontWeight: 700 }}>
          All bins collected!
        </div>
      )}

      {/* ── Up Next — compact, tertiary ── */}
      {upNext.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 4 }}>
            Up Next
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {upNext.map(b => (
              <div
                key={b.id}
                onClick={() => navigate(`/bin/${b.id}`)}
                style={{
                  background: 'white',
                  borderRadius: 10,
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
              >
                {/* Stop number pill */}
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>{b.stopNumber}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{b.distance} km · {b.area}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {b.priority === 'HIGH' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />}
                  {b.priority === 'MEDIUM' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />}
                  <ChevronRight size={14} color="#d1d5db" strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}

const btnNavigate = {
  width: '100%', minHeight: 50, borderRadius: 12, border: 'none',
  fontSize: 15, fontWeight: 700, background: '#16a34a', color: 'white',
  cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};
const btnDetails = {
  width: '100%', minHeight: 38, borderRadius: 10,
  border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 500,
  background: 'transparent', color: '#9ca3af',
  cursor: 'pointer', fontFamily: 'inherit',
};
