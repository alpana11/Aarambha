import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function BinCard({ bin, highlight = false }) {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  const isDone   = bin.priority === 'DONE';
  const iconBg   = isDone ? '#dcfce7' : bin.priority === 'HIGH' ? '#fee2e2' : '#fef9c3';
  const BinIcon  = isDone ? CheckCircle : bin.priority === 'HIGH' ? AlertCircle : Trash2;
  const iconColor = isDone ? '#16a34a' : bin.priority === 'HIGH' ? '#dc2626' : '#d97706';
  const detail   = isDone
    ? `Collected at ${bin.collectedAt}`
    : `Stop #${bin.stopNumber} · ${bin.distance} km · ${bin.area}`;

  return (
    <div
      onClick={() => navigate(`/bin/${bin.id}`)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background:    isDone ? '#fafafa' : pressed ? '#f9fafb' : 'white',
        border:        '0.5px solid #e5e7eb',
        borderLeft:    highlight ? '3px solid #ef4444' : isDone ? '3px solid #16a34a' : '0.5px solid #e5e7eb',
        borderRadius:  12,
        padding:       '12px 14px',
        minHeight:     56,
        marginBottom:  8,
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        cursor:        'pointer',
        opacity:       isDone ? 0.72 : 1,
        transition:    'opacity 0.15s, background 0.15s',
        boxShadow:     isDone ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <BinIcon size={18} color={iconColor} strokeWidth={2} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? '#6b7280' : '#111827', textDecoration: isDone ? 'line-through' : 'none' }}>
          {bin.name}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{detail}</div>
      </div>

      <StatusBadge priority={bin.priority} />
    </div>
  );
}
