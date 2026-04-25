import { useState, useEffect, useCallback, useRef } from 'react';

const TYPES = {
  success: { bg: '#15803d', icon: '✓' },
  error:   { bg: '#dc2626', icon: '✗' },
  info:    { bg: '#1d4ed8', icon: 'ℹ' },
};

let _show;
export function showToast(msg, type = 'success') { _show?.(msg, type); }

export default function Toast() {
  const [msg,     setMsg]     = useState('');
  const [type,    setType]    = useState('success');
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef    = useRef(null);
  const intervalRef = useRef(null);

  const show = useCallback((m, t = 'success') => {
    // Clear any running timers before starting fresh
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);

    setMsg(m);
    setType(t);
    setProgress(100);
    setVisible(true);

    const DURATION = 2500;
    const TICK     = 50;
    let elapsed    = 0;

    intervalRef.current = setInterval(() => {
      elapsed += TICK;
      setProgress(Math.max(0, 100 - (elapsed / DURATION) * 100));
    }, TICK);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setVisible(false);
    }, DURATION);
  }, []);

  useEffect(() => {
    _show = show;
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, [show]);

  const { bg, icon } = TYPES[type] ?? TYPES.success;

  return (
    <div style={{
      position:   'fixed',
      bottom:     40,
      left:       '50%',
      transform:  `translateX(-50%) translateY(${visible ? '0' : '120px'})`,
      background: bg,
      color:      'white',
      borderRadius: 14,
      fontSize:   13,
      fontWeight: 500,
      zIndex:     200,
      pointerEvents: 'none',
      boxShadow:  '0 4px 16px rgba(0,0,0,0.25)',
      minWidth:   200,
      overflow:   'hidden',
      transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Content row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px' }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
        <span>{msg}</span>
      </div>
      {/* Drain bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.25)' }}>
        <div style={{
          height: '100%',
          width:  `${progress}%`,
          background: 'rgba(255,255,255,0.7)',
          transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  );
}
