import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Generate a random COL-XXX ID
function generateCollectorId() {
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `COL-${num}`;
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  // Sign in state
  const [siId,      setSiId]      = useState('');
  const [siPin,     setSiPin]     = useState('');
  const [siShowPin, setSiShowPin] = useState(false);

  // Sign up state
  const [suName,     setSuName]     = useState('');
  const [suTruck,    setSuTruck]    = useState('');
  const [suZone,     setSuZone]     = useState('');
  const [suArea,     setSuArea]     = useState('');
  const [suPin,      setSuPin]      = useState('');
  const [suShowPin,  setSuShowPin]  = useState(false);

  // Shared state
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(''); // shows generated ID after signup

  // ── Sign In ────────────────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    if (!siId.trim() || !siPin.trim()) { setError('Enter your Collector ID and PIN.'); return; }

    setLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db, 'drivers'),
        where('collectorId', '==', siId.trim().toUpperCase())
      ));

      if (snap.empty) { setError('Collector ID not found.'); setLoading(false); return; }

      const driverDoc  = snap.docs[0];
      const driverData = driverDoc.data();

      if (String(driverData.pin) !== String(siPin.trim())) {
        setError('Incorrect PIN. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('driver_id',    driverDoc.id);
      localStorage.setItem('collector_id', driverData.collectorId);
      localStorage.setItem('driver_name',  driverData.name);
      navigate('/main');
    } catch (err) {
      console.error(err);
      setError('Connection error. Check your network.');
      setLoading(false);
    }
  }

  // ── Sign Up ────────────────────────────────────────────────────
  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    if (!suName.trim() || !suTruck.trim() || !suZone.trim() || !suPin.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (suPin.trim().length < 4) { setError('PIN must be at least 4 digits.'); return; }

    setLoading(true);
    try {
      // Generate unique COL-XXX ID (retry if collision)
      let collectorId, exists = true;
      while (exists) {
        collectorId = generateCollectorId();
        const check = await getDocs(query(
          collection(db, 'drivers'),
          where('collectorId', '==', collectorId)
        ));
        exists = !check.empty;
      }

      // Use collectorId as the Firestore doc ID so route queries work
      const driverDocId = collectorId;
      await setDoc(doc(db, 'drivers', driverDocId), {
        collectorId,
        name:        suName.trim(),
        truckNumber: suTruck.trim().toUpperCase(),
        zone:        suZone.trim(),
        area:        suArea.trim() || suZone.trim(),
        shiftStart:  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        pin:         suPin.trim(),
      });

      // Assign the shared demo route to this new driver
      await updateDoc(doc(db, 'routes', 'ROUTE-001'), { driverId: driverDocId });

      setSuccess(collectorId);
      localStorage.setItem('driver_id',    driverDocId);
      localStorage.setItem('collector_id', collectorId);
      localStorage.setItem('driver_name',  suName.trim());
    } catch (err) {
      console.error(err);
      setError('Failed to create account. Try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{ background: '#1a3a2a', minHeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '32px 24px' }}>
      <div style={{ textAlign: 'center', width: '100%' }}>

        {/* Logo */}
        <div style={{ width: 64, height: 64, background: '#16a34a', borderRadius: 20, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Truck size={30} color="white" strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>SwachhMitra</div>
        <div style={{ fontSize: 13, color: '#86efac', marginBottom: 24 }}>Driver App</div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {[['signin', 'Sign In'], ['signup', 'New Account']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                background: tab === key ? '#16a34a' : 'transparent',
                color:      tab === key ? 'white'   : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }}
            >{label}</button>
          ))}
        </div>

        {/* ── Sign In form ── */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={formStyle}>
            <label style={fieldLabel}>Collector ID</label>
            <input style={inputStyle} type="text" placeholder="e.g. COL-042"
              value={siId} onChange={e => { setSiId(e.target.value); setError(''); }}
              autoCapitalize="characters" autoComplete="off" />

            <label style={fieldLabel}>PIN</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
                type={siShowPin ? 'text' : 'password'} placeholder="••••"
                value={siPin} onChange={e => { setSiPin(e.target.value); setError(''); }} />
              <button type="button" onClick={() => setSiShowPin(v => !v)} style={eyeBtn}>
                {siShowPin ? <EyeOff size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                           : <Eye    size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />}
              </button>
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="tap-btn" disabled={loading} style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Start Shift'}
            </button>
          </form>
        )}

        {/* ── Sign Up form ── */}
        {tab === 'signup' && !success && (
          <form onSubmit={handleSignUp} style={formStyle}>
            <label style={fieldLabel}>Full Name *</label>
            <input style={inputStyle} type="text" placeholder="e.g. Ravi Kumar"
              value={suName} onChange={e => { setSuName(e.target.value); setError(''); }} />

            <label style={fieldLabel}>Truck Number *</label>
            <input style={inputStyle} type="text" placeholder="e.g. T-07"
              value={suTruck} onChange={e => { setSuTruck(e.target.value); setError(''); }} />

            <label style={fieldLabel}>Zone *</label>
            <input style={inputStyle} type="text" placeholder="e.g. Zone B"
              value={suZone} onChange={e => { setSuZone(e.target.value); setError(''); }} />

            <label style={fieldLabel}>Area / Ward</label>
            <input style={inputStyle} type="text" placeholder="e.g. Market Area · Ward 12"
              value={suArea} onChange={e => { setSuArea(e.target.value); setError(''); }} />

            <label style={fieldLabel}>Set PIN * (min 4 digits)</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
                type={suShowPin ? 'text' : 'password'} placeholder="Create a PIN"
                value={suPin} onChange={e => { setSuPin(e.target.value); setError(''); }} />
              <button type="button" onClick={() => setSuShowPin(v => !v)} style={eyeBtn}>
                {suShowPin ? <EyeOff size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                           : <Eye    size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />}
              </button>
            </div>

            {error && <ErrorBox msg={error} />}

            <button type="submit" className="tap-btn" disabled={loading} style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* ── Sign Up success — show generated ID ── */}
        {tab === 'signup' && success && (
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <CheckCircle size={40} color="#4ade80" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 8 }}>Account Created!</div>
            <div style={{ fontSize: 12, color: '#86efac', marginBottom: 16 }}>Save your Collector ID — you'll need it to sign in.</div>

            <div style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid #16a34a', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#86efac', marginBottom: 4 }}>Your Collector ID</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: 2 }}>{success}</div>
            </div>

            <button
              className="tap-btn"
              onClick={() => navigate('/main')}
              style={submitBtn}
            >
              Continue to App
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
      <AlertCircle size={14} color="#fca5a5" strokeWidth={2} />
      <span style={{ fontSize: 12, color: '#fca5a5' }}>{msg}</span>
    </div>
  );
}

const formStyle  = { background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: 20, textAlign: 'left' };
const fieldLabel = { display: 'block', fontSize: 11, color: '#86efac', marginBottom: 6 };
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'inherit', fontSize: 14, padding: '10px 12px', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.4)', outline: 'none', marginBottom: 14, boxSizing: 'border-box' };
const submitBtn  = { width: '100%', padding: 12, borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 600, background: '#16a34a', color: 'white', cursor: 'pointer', fontFamily: 'inherit' };
const eyeBtn     = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' };
