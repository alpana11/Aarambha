export default function DoneTab({ bins, collectedCount, distanceCovered, driver }) {
  const done = bins.filter(b => b.priority === 'DONE');

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f3f4f6' }}>
      <div style={sectionLabel}>Completed today</div>

      {done.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: '#9ca3af' }}>No bins collected yet</div>
      )}

      {done.map(b => (
        <div key={b.id} style={{ background: 'white', border: '0.5px solid #e5e7eb', borderLeft: '3px solid #16a34a', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{b.name}</div>
            <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: '#dcfce7', color: '#166534' }}>Done</span>
          </div>
          {[
            { lbl: 'Collected at', val: b.collectedAt },
            { lbl: 'Fill level',   val: `${b.fillLevel}%${b.fillLevel === 100 ? ' (Full)' : b.fillLevel >= 90 ? ' (Near Full)' : ''}` },
            { lbl: 'Area type',    val: b.area },
          ].map(({ lbl, val }, i, arr) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f3f4f6' : 'none' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{val}</span>
            </div>
          ))}
        </div>
      ))}

      {/* Shift progress — live data */}
      <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 8 }}>Shift progress</div>
        {[
          { lbl: 'Bins collected',   val: `${collectedCount} / ${bins.length}` },
          { lbl: 'Distance covered', val: `${distanceCovered} km`              },
          { lbl: 'Shift started',    val: driver.shiftStart                    },
        ].map(({ lbl, val }, i, arr) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f3f4f6' : 'none' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}

const sectionLabel = { fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' };
