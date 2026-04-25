export default function ProgressBar({ collected, total }) {
  const pct = Math.round((collected / total) * 100);
  return (
    <div style={{ flex: 1, minWidth: 60 }}>
      <div style={{ height: 4, background: '#bbf7d0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#16a34a', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}
