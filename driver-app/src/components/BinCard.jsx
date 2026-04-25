import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function BinCard({ bin, highlight = false }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const iconBg = bin.priority === 'DONE' ? '#dcfce7'
    : bin.priority === 'HIGH' ? '#fee2e2' : '#fef9c3';

  const detail = bin.priority === 'DONE'
    ? `Collected at ${bin.collectedAt}`
    : `Stop #${bin.stopNumber} · ${bin.distance} km · ${bin.area}`;

  return (
    <div
      onClick={() => navigate(`/bin/${bin.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#f9fafb' : 'white',
        border: '0.5px solid #e5e7eb',
        borderLeft: highlight ? '3px solid #ef4444' : '0.5px solid #e5e7eb',
        borderRadius: 12,
        padding: '12px 14px',
        minHeight: 44,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, flexShrink: 0,
      }}>
        {bin.priority === 'DONE' ? '✓' : '🗑'}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{bin.name}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{detail}</div>
      </div>

      <StatusBadge priority={bin.priority} />
    </div>
  );
}
