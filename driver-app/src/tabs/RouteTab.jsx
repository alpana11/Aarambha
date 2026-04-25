import { useNavigate } from 'react-router-dom';
import BinCard from '../components/BinCard';
import StatusBadge from '../components/StatusBadge';
import { showToast } from '../components/Toast';

export default function RouteTab({ bins }) {
  const navigate = useNavigate();
  const pending  = bins.filter(b => b.priority !== 'DONE');
  const nextStop = pending[0] ?? null;
  const upNext   = pending.slice(1);
  const kmLeft   = pending.reduce((s, b) => s + b.distance, 0).toFixed(1);
  const minEst   = Math.round(pending.length * 7.5);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f3f4f6' }}>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { num: pending.length, lbl: 'Remaining' },
          { num: kmLeft,         lbl: 'km left'   },
          { num: `~${minEst}`,   lbl: 'min est.'  },
        ].map(({ num, lbl }) => (
          <div key={lbl} style={{ background: '#e9f7ef', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#111827' }}>{num}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {nextStop ? (
        <>
          <div style={sectionLabel}>Next stop</div>
          <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderLeft: '3px solid #ef4444', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 4 }}>{nextStop.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{nextStop.distance} km away · {nextStop.area}</div>
              </div>
              <StatusBadge priority={nextStop.priority} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={btnPrimary}   onClick={() => showToast('Opening navigation...')}>Navigate</button>
              <button style={btnSecondary} onClick={() => navigate(`/bin/${nextStop.id}`)}>Details</button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 15, color: '#16a34a', fontWeight: 500 }}>
          🎉 All bins collected!
        </div>
      )}

      {upNext.length > 0 && (
        <>
          <div style={sectionLabel}>Up next</div>
          {upNext.map(b => <BinCard key={b.id} bin={b} />)}
        </>
      )}
      <div style={{ height: 16 }} />
    </div>
  );
}

const sectionLabel = { fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' };
const btnPrimary   = { flex: 1, minHeight: 44, padding: '10px 9px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 500, background: '#16a34a', color: 'white', cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondary = { flex: 1, minHeight: 44, padding: '10px 9px', borderRadius: 12, border: '0.5px solid #e5e7eb', fontSize: 13, fontWeight: 500, background: '#f3f4f6', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' };
