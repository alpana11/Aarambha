import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Same colour system as the web app
const PRIORITY_COLOR = {
  HIGH:   '#ef4444',
  MEDIUM: '#f59e0b',
  DONE:   '#22c55e',
};

const LEGEND = [
  { color: '#3b82f6', label: 'You'  },
  { color: '#ef4444', label: 'High' },
  { color: '#f59e0b', label: 'Med'  },
  { color: '#22c55e', label: 'Done' },
];

// Fallback coords matching web app's Delhi area (28.6139, 77.2090)
const FALLBACK_COORDS = [
  [28.6155, 77.2105],
  [28.6170, 77.2125],
  [28.6140, 77.2140],
  [28.6185, 77.2090],
  [28.6125, 77.2115],
  [28.6200, 77.2080],
  [28.6165, 77.2155],
];

// Auto-fit map bounds to all markers
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [32, 32] });
    }
  }, [map, positions]);
  return null;
}

export default function MapTab({ bins, collectedCount, total, routeSummary, driver }) {
  const sorted    = [...bins].sort((a, b) => a.stopNumber - b.stopNumber);
  const positions = sorted.map((b, i) =>
    b.lat && b.lng ? [b.lat, b.lng] : FALLBACK_COORDS[i] ?? FALLBACK_COORDS[0]
  );
  const center = positions[0] ?? [28.6139, 77.2090];

  return (
    <div style={{ padding: '12px 16px 20px', background: '#f1f8f4' }}>

      {/* ── Live Leaflet map ── */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12, height: 280 }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />

          <FitBounds positions={positions} />

          {/* Bin markers */}
          {sorted.map((b, i) => {
            const pos   = positions[i];
            const color = PRIORITY_COLOR[b.priority] ?? '#9ca3af';
            return (
              <CircleMarker
                key={b.id}
                center={pos}
                radius={10}
                pathOptions={{
                  color:       'white',
                  weight:      2,
                  fillColor:   color,
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{b.area}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Fill: {b.fillLevel}%</div>
                    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: color }}>
                      {b.priority}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, paddingLeft: 2 }}>
        {LEGEND.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: '1.5px solid white', boxShadow: '0 0 0 1px #e5e7eb' }} />
            <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Route summary */}
      <div style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Route Summary</div>
        {[
          { lbl: 'Total stops',          val: total,                                       green: false },
          { lbl: 'Completed',            val: `${collectedCount} / ${total}`,              green: true  },
          { lbl: 'Total route distance', val: `${routeSummary.totalDistance} km`,          green: false },
          { lbl: 'Optimized (saved)',    val: `-${routeSummary.savedDistance} km`,         green: true  },
          { lbl: 'Est. completion',      val: routeSummary.estimatedCompletion,            green: false },
        ].map(({ lbl, val, green }, i, arr) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f9f5' : 'none' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: green ? '#16a34a' : '#111827' }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}
