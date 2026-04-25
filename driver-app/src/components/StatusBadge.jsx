const STYLES = {
  HIGH:    { background: '#fee2e2', color: '#991b1b' },
  MEDIUM:  { background: '#fef9c3', color: '#854d0e' },
  DONE:    { background: '#dcfce7', color: '#166534' },
  PENDING: { background: '#f3f4f6', color: '#6b7280' },
};

const LABELS = { HIGH: 'HIGH', MEDIUM: 'MED', DONE: 'DONE', PENDING: 'PENDING' };

export default function StatusBadge({ priority }) {
  const style = STYLES[priority] ?? STYLES.PENDING;
  return (
    <span style={{
      ...style,
      fontSize: 10,
      fontWeight: 500,
      padding: '3px 8px',
      borderRadius: 20,
      flexShrink: 0,
    }}>
      {LABELS[priority] ?? priority}
    </span>
  );
}
