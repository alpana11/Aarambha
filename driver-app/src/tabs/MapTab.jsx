import { Truck } from 'lucide-react';

// Static pin positions matching stopNumber order
const PIN_POSITIONS = [
  { left: '18%', top: '24%' },
  { left: '46%', top: '55%' },
  { left: '65%', top: '40%' },
  { left: '30%', top: '70%' },
  { left: '65%', top: '70%' },
  { left: '82%', top: '40%' },
  { left: '82%', top: '70%' },
];

const PRIORITY_PIN_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', DONE: '#22c55e' };

const LEGEND = [
  { color: '#3b82f6', label: 'You'  },
  { color: '#ef4444', label: 'High' },
  { color: '#f59e0b', label: 'Med'  },
  { color: '#22c55e', label: 'Done' },
];

export default function MapTab({ bins, collectedCount, total, routeSummary, driver }) {
  // Sort bins by stopNumber so pin index matches position array
  const sorted = [...bins].sort((a, b) => a.stopNumber - b.stopNumber);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f3f4f6' }}>

      {/* Map mockup */}
      <div style={{ background: '#e8f5e9', borderRadius: 12, height: 200, position: 'relative', overflow: 'hidden', border: '0.5px solid #e5e7eb', marginBottom: 10 }}>
        <div style={{ position: 'absolute', height: 4, background: '#bdbdbd', left: 0, right: 0, top: '40%' }} />
        <div style={{ position: 'absolute', height: 4, background: '#bdbdbd', left: 0, right: 0, top: '70%' }} />
        <div style={{ position: 'absolute', width: 4, background: '#bdbdbd', top: 0, bottom: 0, left: '30%' }} />
        <div style={{ position: 'absolute', width: 4, background: '#bdbdbd', top: 0, bottom: 0, left: '65%' }} />

        <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, color: '#444', background: 'white', padding: '1px 4px', borderRadius: 4 }}>
          {driver.zone} — Active Route
        </div>

        {/* Current truck position */}
        <div style={{ ...pinBase, left: '30%', top: '40%', background: '#3b82f6', width: 26, height: 26, border: '3px solid white' }}>
          <Truck size={12} color="white" strokeWidth={2.5} />
        </div>

        {/* Bin pins — color reflects live priority state */}
        {sorted.map((b, i) => {
          const pos = PIN_POSITIONS[i];
          if (!pos) return null;
          return (
            <div key={b.id} style={{ ...pinBase, left: pos.left, top: pos.top, background: PRIORITY_PIN_COLOR[b.priority] ?? '#9ca3af' }}>
              {b.stopNumber}
            </div>
          );
        })}

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          {LEGEND.map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 9, color: '#333' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Route summary — from routeSummary prop */}
      <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 8 }}>Route Summary</div>
        {[
          { lbl: 'Total stops',          val: total,                                          green: false },
          { lbl: 'Completed',            val: `${collectedCount} / ${total}`,                 green: true  },
          { lbl: 'Total route distance', val: `${routeSummary.totalDistance} km`,             green: false },
          { lbl: 'Optimized (saved)',    val: `-${routeSummary.savedDistance} km`,            green: true  },
          { lbl: 'Est. completion',      val: routeSummary.estimatedCompletion,               green: false },
        ].map(({ lbl, val, green }, i, arr) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f3f4f6' : 'none' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: green ? '#16a34a' : '#111827' }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}

const pinBase = { position: 'absolute', width: 20, height: 20, borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, transform: 'translate(-50%,-50%)', color: 'white' };
