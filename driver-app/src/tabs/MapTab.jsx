import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', DONE: '#22c55e' };
const LEGEND = [
  { color: '#ef4444', label: 'High' },
  { color: '#f59e0b', label: 'Med'  },
  { color: '#22c55e', label: 'Done' },
];

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) map.fitBounds(positions, { padding: [32, 32] });
  }, [map, positions]);
  return null;
}

// Flies to focusedBin when it changes, opens its popup
function FlyTo({ focusedBin, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (!focusedBin) return;
    map.flyTo([focusedBin.lat, focusedBin.lng], 17, { duration: 0.8 });
    // Open popup after fly animation
    const t = setTimeout(() => {
      markerRefs.current[focusedBin.id]?.openPopup();
    }, 900);
    return () => clearTimeout(t);
  }, [focusedBin, map, markerRefs]);
  return null;
}

export default function MapTab({ bins, collectedCount, total, routeSummary, focusedBin, onClearFocus }) {
  const markerRefs = useRef({});
  const mapped     = bins.filter(b => b.lat != null && b.lng != null);
  const positions  = mapped.map(b => [b.lat, b.lng]);

  const center = positions.length > 0
    ? [
        positions.reduce((s, p) => s + p[0], 0) / positions.length,
        positions.reduce((s, p) => s + p[1], 0) / positions.length,
      ]
    : null;

  return (
    <div style={{ padding: '12px 16px 20px', background: '#f1f8f4' }}>

      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12, height: 280 }}>
        {center ? (
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
            {!focusedBin && <FitBounds positions={positions} />}
            <FlyTo focusedBin={focusedBin} markerRefs={markerRefs} />
            {mapped.map(b => {
              const isFocused = focusedBin?.id === b.id;
              const color     = PRIORITY_COLOR[b.priority] ?? '#9ca3af';
              return (
                <CircleMarker
                  key={`${b.id}-${b.priority}`}
                  center={[b.lat, b.lng]}
                  radius={isFocused ? 14 : 10}
                  pathOptions={{
                    color:       isFocused ? '#ffffff' : 'white',
                    weight:      isFocused ? 4 : 2,
                    fillColor:   color,
                    fillOpacity: 1,
                  }}
                  ref={el => { if (el) markerRefs.current[b.id] = el; }}
                  eventHandlers={{ click: () => onClearFocus?.() }}
                >
                  <Popup>
                    <div style={{ minWidth: 140 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{b.area}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Fill: {b.fillLevel}%</div>
                      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color }}>{b.priority}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>No location data available</span>
          </div>
        )}
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
          { lbl: 'Total stops',          val: total },
          { lbl: 'Completed',            val: `${collectedCount} / ${total}` },
          { lbl: 'Total route distance', val: `${routeSummary.totalDistance} km` },
          { lbl: 'Optimized (saved)',    val: `-${routeSummary.savedDistance} km` },
          { lbl: 'Est. completion',      val: routeSummary.estimatedCompletion },
        ].map(({ lbl, val }, i, arr) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f9f5' : 'none' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{lbl}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}