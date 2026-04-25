import { CheckCircle, Clock, MapPin, Zap } from 'lucide-react';

export default function DoneTab({ bins, collectedCount, distanceCovered, driver }) {
  const done  = bins.filter(b => b.priority === 'DONE');
  const total = bins.length;
  const pct   = total > 0 ? Math.round((collectedCount / total) * 100) : 0;
  const allDone = collectedCount === total && total > 0;

  return (
    <div style={{ padding: '12px 16px 20px', background: '#f3f4f6' }}>

      {/* ── Hero summary card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
        borderRadius: 16,
        padding: '18px 20px 16px',
        marginBottom: 16,
        boxShadow: '0 4px 20px rgba(22,101,52,0.25)',
      }}>
        {/* Top row: label + shift time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Shift Progress
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color="#86efac" strokeWidth={2} />
            <span style={{ fontSize: 11, color: '#86efac' }}>Since {driver.shiftStart}</span>
          </div>
        </div>

        {/* Primary metric — bins done */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1 }}>{collectedCount}</span>
            <span style={{ fontSize: 18, fontWeight: 400, color: '#86efac', lineHeight: 1 }}>/ {total}</span>
            <span style={{ fontSize: 13, color: '#86efac', marginLeft: 4 }}>bins collected</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: allDone ? '#4ade80' : '#86efac',
              borderRadius: 99, transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 10, color: '#86efac' }}>{pct}% complete</span>
            {allDone && (
              <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>Route complete!</span>
            )}
          </div>
        </div>

        {/* Secondary metrics row */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12 }}>
          {[
            { icon: <MapPin size={12} color="#86efac" strokeWidth={2} />, val: `${distanceCovered} km`, lbl: 'Covered' },
            { icon: <Zap    size={12} color="#86efac" strokeWidth={2} />, val: `${total - collectedCount}`,  lbl: 'Remaining' },
          ].map(({ icon, val, lbl }, i) => (
            <div key={lbl} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: i === 1 ? 16 : 0, borderLeft: i === 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
              {icon}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 10, color: '#86efac', marginTop: 2 }}>{lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Completed list ── */}
      {done.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircle size={22} color="#86efac" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>No bins collected yet</div>
          <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 4 }}>Completed bins will appear here</div>
        </div>
      ) : (
        <>
          <div style={sectionHeader}>
            <CheckCircle size={11} color="#16a34a" strokeWidth={2.5} />
            Collected today
            <span style={countPill}>{done.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {done.map(b => (
              <div key={b.id} style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                borderLeft: '3px solid #86efac',
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {/* Check icon */}
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={15} color="#16a34a" strokeWidth={2.5} />
                </div>

                {/* Name + area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {b.area} · {b.fillLevel}% fill
                  </div>
                </div>

                {/* Time */}
                {b.collectedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <Clock size={11} color="#9ca3af" strokeWidth={2} />
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{b.collectedAt}</span>
                  </div>
                )}
              </div>
            ))}
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
const countPill = {
  background: '#dcfce7', color: '#166534',
  fontSize: 10, fontWeight: 700,
  padding: '1px 6px', borderRadius: 20, marginLeft: 2,
};
