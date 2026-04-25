export default function ProgressBar({ collected, total }) {
  const pct = Math.round((collected / total) * 100);
  return (
    <>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#4ade80', borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 10, color: '#86efac' }}>{collected} of {total} bins collected</span>
        <span style={{ fontSize: 10, color: '#86efac' }}>{pct}%</span>
      </div>
    </>
  );
}
