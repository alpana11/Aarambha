import { useNavigate } from 'react-router-dom';
import { Navigation, AlertTriangle, Clock, MapPin, ChevronRight, Trash2, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { showToast } from '../components/Toast';

export default function RouteTab({ bins }) {
  const navigate = useNavigate();
  const pending  = bins.filter(b => b.priority !== 'DONE');
  const nextStop = pending[0] ?? null;
  const upNext   = pending.slice(1);
  const kmLeft   = pending.reduce((s, b) => s + b.distance, 0).toFixed(1);
  const minEst   = Math.round(pending.length * 7.5);

  const isHigh = nextStop?.priority === 'HIGH';
  const isMed  = nextStop?.priority === 'MEDIUM';
  const accent = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#16a34a';

  return (
    <div style={{ padding: '8px 16px 20px', background: '#f1f8f4' }}>

      {/* ── Stats strip — inline, no boxes ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingTop: 4 }}>
        <span style={statVal}>{pending.length}</span>
        <span style={statLbl}>remaining</span>
        <span style={dot}>·</span>
        <span style={statVal}>{kmLeft} km</span>
        <span style={statLbl}>left</span>
        <span style={dot}>·</span>
        <span style={statVal}>~{minEst} min</span>
      </div>

      {nextStop ? (
        <>
          <div style={sectionLabel}>Next Stop</div>

          {/* ── Hero card ── */}
          <div style={{
            background: 'white',
            borderRadius: 16,
            marginBottom: 16,
            overflow: 'hidden',
            boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
            border: '1px solid #f0f0f0',
          }}>
            <div style={{ height: 4, background: accent }} />

            <div style={{ padding: '14px 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.2, flex: 1, marginRight: 10 }}>
                  {nextStop.name}
                </div>
                <StatusBadge priority={nextStop.priority} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <MapPin size={13} color="#9ca3af" strokeWidth={2} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>{nextStop.area}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{nextStop.distance} km away</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Stop #{nextStop.stopNumber}</span>
              </div>

              {isHigh && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 10px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} color="#dc2626" strokeWidth={2} />
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>High priority — collect immediately</span>
                </div>
              )}
              {isMed && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="#d97706" strokeWidth={2} />
                  <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>Medium priority</span>
                </div>
              )}

              <button className="tap-btn" style={btnNavigate} onClick={() => showToast('Opening navigation...')}>
                <Navigation size={17} color="white" strokeWidth={2} />
                Navigate
              </button>

              <button className="tap-btn" style={btnDetails} onClick={() => navigate(`/bin/${nextStop.id}`)}>
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

      {/* ── Up Next ── */}
      {upNext.length > 0 && (
        <>
          <div style={{ ...sectionLabel, marginTop: 4 }}>Up Next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upNext.map(b => (
              <div
                key={b.id}
                onClick={() => navigate(`/bin/${b.id}`)}
                className="tap"
                style={{
                  background: 'white',
                  borderRadius: 10,
                  padding: '11px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0',
                }}
              >
                {/* Icon container */}
                {(() => {
                  const isH = b.priority === 'HIGH';
                  const isM = b.priority === 'MEDIUM';
                  const bg  = isH ? '#fef2f2' : isM ? '#fffbeb' : '#f0fdf4';
                  const clr = isH ? '#ef4444' : isM ? '#f59e0b' : '#16a34a';
                  const Icon = isH ? AlertCircle : Trash2;
                  return (
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={clr} strokeWidth={2} />
                    </div>
                  );
                })()}

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{b.distance} km · {b.area}</div>
                </div>

                {/* Priority badge + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {b.priority === 'HIGH' && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: 20 }}>HIGH</span>
                  )}
                  {b.priority === 'MEDIUM' && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', background: '#fef9c3', padding: '2px 6px', borderRadius: 20 }}>MED</span>
                  )}
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

const sectionLabel = { fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 };
const statVal      = { fontSize: 13, fontWeight: 700, color: '#374151' };
const statLbl      = { fontSize: 12, color: '#9ca3af' };
const dot          = { fontSize: 12, color: '#d1d5db', margin: '0 2px' };
const btnNavigate  = {
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
