export default function FillLevelBar({ fill }) {
  const filled = Math.round(fill / 10);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32, margin: '10px 0 6px' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8 + i * 2.2,
              borderRadius: '3px 3px 0 0',
              background: i < filled ? '#ef4444' : '#f3f4f6',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>0%</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{fill}%</span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>100%</span>
      </div>
    </>
  );
}
