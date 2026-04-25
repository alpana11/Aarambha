import { useState, useCallback, useEffect, useRef } from 'react';

let _show;
export function confirmDialog(opts) {
  return new Promise(resolve => _show?.(opts, resolve));
}

export default function ConfirmDialog() {
  const [visible,  setVisible]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [opts,     setOpts]     = useState({});
  const resolveRef = useRef(null);

  const show = useCallback((options, resolve) => {
    setOpts(options);
    resolveRef.current = resolve;
    setMounted(true);
    // Small delay so the mount triggers the CSS transition
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  useEffect(() => { _show = show; }, [show]);

  function respond(value) {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      resolveRef.current?.(value);
    }, 250);
  }

  if (!mounted) return null;

  return (
    <div
      onClick={() => respond(false)}
      style={{
        position:   'fixed', inset: 0,
        background: `rgba(0,0,0,${visible ? 0.45 : 0})`,
        display:    'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex:     300,
        transition: 'background 0.25s',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:        '100%',
          maxWidth:     390,
          background:   'white',
          borderRadius: '20px 20px 0 0',
          padding:      '24px 20px 32px',
          transform:    `translateY(${visible ? '0' : '100%'})`,
          transition:   'transform 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          boxShadow:    '0 -4px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 99, margin: '0 auto 20px' }} />

        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 14px' }}>
          🗑
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
            {opts.title ?? 'Confirm Collection'}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {opts.message ?? 'Mark this bin as collected?'}
          </div>
          {opts.sub && (
            <div style={{ marginTop: 10, background: '#f3f4f6', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#374151' }}>
              {opts.sub}
            </div>
          )}
        </div>

        {/* Buttons — both 44px min height */}
        <button
          onClick={() => respond(true)}
          style={{ ...btnBase, background: '#16a34a', color: 'white', marginBottom: 10 }}
        >
          ✓ Yes, Mark as Collected
        </button>
        <button
          onClick={() => respond(false)}
          style={{ ...btnBase, background: '#f3f4f6', color: '#374151', border: '0.5px solid #e5e7eb' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const btnBase = {
  width: '100%', minHeight: 44, padding: '11px 12px',
  borderRadius: 12, border: 'none',
  fontSize: 14, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
