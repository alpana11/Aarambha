import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [collectorId, setCollectorId] = useState('COL-042');
  const [pin, setPin] = useState('1234');

  function handleSubmit(e) {
    e.preventDefault();
    navigate('/main');
  }

  return (
    <div style={{ background: '#1a3a2a', minHeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', width: '100%' }}>

        <div style={{ width: 64, height: 64, background: '#16a34a', borderRadius: 20, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          🚛
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'white', marginBottom: 4 }}>SwachhMitra</div>
        <div style={{ fontSize: 13, color: '#86efac', marginBottom: 40 }}>Collector App</div>

        <form
          onSubmit={handleSubmit}
          style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 20, textAlign: 'left' }}
        >
          <label style={fieldLabel}>Collector ID</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="e.g. COL-042"
            value={collectorId}
            onChange={e => setCollectorId(e.target.value)}
          />

          <label style={fieldLabel}>PIN</label>
          <input
            style={{ ...inputStyle, marginBottom: 20 }}
            type="password"
            placeholder="••••"
            value={pin}
            onChange={e => setPin(e.target.value)}
          />

          <button type="submit" style={submitBtn}>Start Shift</button>
        </form>

        <div style={{ marginTop: 20, fontSize: 11, color: 'rgba(74,222,128,0.6)' }}>Demo: use any credentials</div>
      </div>
    </div>
  );
}

const fieldLabel = { display: 'block', fontSize: 11, color: '#86efac', marginBottom: 6 };
const inputStyle  = { width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit', fontSize: 14, padding: '10px 12px', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.4)', outline: 'none', marginBottom: 14, boxSizing: 'border-box' };
const submitBtn   = { width: '100%', padding: 12, borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 500, background: '#16a34a', color: 'white', cursor: 'pointer', fontFamily: 'inherit' };
