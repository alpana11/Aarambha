import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react';
import { useBins } from '../context/BinsContext';

export default function NotificationsTab() {
  const navigate  = useNavigate();
  const { fullBins } = useBins();

  if (fullBins.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', background: '#f1f8f4', minHeight: 300 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <CheckCircle size={24} color="#86efac" strokeWidth={1.5} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>All clear</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>No full bins right now</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px 20px', background: '#f1f8f4' }}>

      {/* Alert banner */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AlertTriangle size={16} color="#dc2626" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
            {fullBins.length} bin{fullBins.length > 1 ? 's are' : ' is'} full — collection needed
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            Tap a bin to view details · Sorted nearest first
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
        Pickup Order · Nearest First
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fullBins.map((bin, i) => {
          const name = bin.location ?? bin.name ?? bin.id;
          const area = bin.areaType ?? bin.area ?? '—';
          const fill = bin.fillLevel ?? 100;

          return (
            <div
              key={bin.id}
              className="tap"
              onClick={() => navigate(`/bin/${bin.id}`)}
              style={{
                background: 'white', borderRadius: 12, cursor: 'pointer',
                border: '1px solid #f0f0f0',
                borderLeft: `3px solid ${i === 0 ? '#ef4444' : '#fca5a5'}`,
                padding: '11px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              {/* Order badge */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? '#ef4444' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? 'white' : '#dc2626' }}>
                  {i + 1}
                </span>
              </div>

              {/* Name + area + distance */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                  {i === 0 && (
                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#ef4444', background: '#fee2e2', padding: '1px 5px', borderRadius: 4 }}>
                      NEAREST
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <MapPin size={10} color="#9ca3af" strokeWidth={2} />
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {area} · {bin.distance} km away
                  </span>
                </div>
              </div>

              {/* Fill level */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{fill}%</div>
                <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>FULL</div>
              </div>

              {/* Chevron hint */}
              <div style={{ fontSize: 16, color: '#d1d5db', flexShrink: 0 }}>›</div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}
