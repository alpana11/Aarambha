import BinCard from '../components/BinCard';

export default function BinsTab({ bins }) {
  const nextStopId = bins.find(b => b.priority !== 'DONE')?.id;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f3f4f6' }}>
      <div style={sectionLabel}>All assigned bins ({bins.length})</div>
      {bins.map(b => <BinCard key={b.id} bin={b} highlight={b.id === nextStopId} />)}
      <div style={{ height: 16 }} />
    </div>
  );
}

const sectionLabel = { fontSize: 11, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' };
