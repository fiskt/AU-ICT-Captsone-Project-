import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '/logo.png';
import background from '../assets/background.webp';

const checks = [
  { id: 'length',  label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'case',    label: 'Uppercase and lowercase letters', test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number (0–9)',       test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special character (! @ # $ %)',   test: (p) => /[!@#$%^&*]/.test(p) },
];

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

export default function Register() {
  const [role, setRole] = useState('coach');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const width = useWindowWidth();
  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 768;

  const cardWidth = isMobile ? '92vw' : isTablet ? '420px' : '430px';
  const cardPad   = isMobile ? '18px 16px 22px' : '28px 36px 32px';
  const titleSize = isMobile ? '26px' : '32px';
  const logoSize  = isMobile ? '36px' : '52px';
  const logoTop   = isMobile ? '14px' : '24px';
  const logoLeft  = isMobile ? '14px' : '24px';
  const inputSize = isMobile ? '16px' : '14px'; // 16px prevents iOS zoom

  const passChecks = checks.map((c) => ({ ...c, passed: c.test(password) }));
  const allChecksPassed = passChecks.every((c) => c.passed);

  const sharedInput = {
    width: '100%', padding: '10px 12px', fontSize: inputSize,
    fontFamily: 'DM Sans Light, sans-serif', border: '2px solid #DDDBD6',
    borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
    color: '#000', background: '#fff',
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName || !lastName || !email || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (role === 'coach' && !email.endsWith('@tennis.com.au')) { setError('This email is not authorised to register as a coach.'); return; }
    if (!allChecksPassed) { setError('Password does not meet all requirements.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role, first_name: firstName, last_name: lastName },
      },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }

    // Empty identities array means email already exists in Supabase
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('This email is already registered. Please log in instead.');
      setLoading(false);
      return;
    }

    // data.user can be null when confirmation pending — still show success screen
    if (!data.user) { setLoading(false); setRegistered(true); return; }

    await supabase.from('signin_details').insert({ id: data.user.id, first_name: firstName, last_name: lastName, email, role });
    setLoading(false);
    setRegistered(true);
  };

  // ── Check your email screen ──
  if (registered) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'left' }}>
        <img src={background} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <img src={logo} alt="Logo" style={{ position: 'fixed', top: logoTop, left: logoLeft, width: logoSize, height: logoSize, objectFit: 'contain', zIndex: 2 }} />
        <div style={{ position: 'relative', zIndex: 2, width: cardWidth, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ backgroundColor: '#C8714E', padding: '20px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: titleSize, color: '#fff', letterSpacing: '2px' }}>CHECK YOUR EMAIL</h1>
          </div>
          <div style={{ backgroundColor: '#fff', padding: cardPad }}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>📧</div>
            <p style={{ fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000', textAlign: 'center', marginBottom: '12px' }}>
              We've sent a confirmation link to <strong>{email}</strong>.
            </p>
            <p style={{ fontSize: '13px', fontFamily: 'DM Sans Light, sans-serif', color: '#6B6760', textAlign: 'center', marginBottom: '10px' }}>
              Click the link in the email to verify your account and you'll be taken straight to your dashboard.
            </p>
            <p style={{ fontSize: '13px', fontFamily: 'DM Sans Light, sans-serif', color: '#6B6760', textAlign: 'center', marginBottom: '10px' }}>
              Didn't receive it? Check your spam folder or{' '}
              <span style={{ color: '#C8714E', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setRegistered(false)}>try again</span>.
            </p>
            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' }}>
              Already verified?{' '}<Link to="/Login" style={{ color: '#000', fontWeight: '600', textDecoration: 'underline' }}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', overflowY: 'auto', textAlign: 'left', padding: isMobile ? '70px 0 30px' : '20px 0' }}>
      <img src={background} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <img src={logo} alt="Logo" style={{ position: 'fixed', top: logoTop, left: logoLeft, width: logoSize, height: logoSize, objectFit: 'contain', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 2, width: cardWidth, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', margin: 'auto' }}>
        <div style={{ backgroundColor: '#C8714E', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: titleSize, color: '#fff', letterSpacing: '2px' }}>REGISTER</h1>
        </div>

        <div style={{ backgroundColor: '#fff', padding: cardPad }}>
          {/* Role toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', border: '2px solid #DDDBD6', overflow: 'hidden', marginBottom: '18px' }}>
            {['coach', 'player'].map((r) => (
              <button key={r} type="button"
                style={{ flex: 1, padding: isMobile ? '10px 0' : '12px 0', fontSize: isMobile ? '14px' : '15px', fontFamily: 'DM Sans Light, sans-serif', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background 0.2s', background: role === r ? '#fff' : 'transparent', color: role === r ? '#000' : '#6B6760', boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}
                onClick={() => { setRole(r); setError(''); }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Name row — stacks on mobile */}
            <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={sharedInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={sharedInput} />
              </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                style={sharedInput} />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ ...sharedInput, paddingRight: '60px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {/* Password requirements */}
              <div style={{ background: '#FAF9F7', border: '1.5px solid #DDDBD6', borderRadius: '8px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                {passChecks.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: c.passed ? '#16a34a' : '#DC2626', transition: 'background 0.2s' }} />
                    <span style={{ fontSize: '12px', fontFamily: 'DM Sans Light, sans-serif', color: c.passed ? '#16a34a' : '#DC2626' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Re-enter password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ ...sharedInput, paddingRight: '60px' }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 }}>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p style={{ margin: 0, fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ marginTop: '4px', width: '100%', padding: isMobile ? '12px' : '14px', background: '#C8714E', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '18px' : '20px', letterSpacing: '2px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>

          <p style={{ marginTop: '18px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' }}>
            Already have an account?{' '}
            <Link to="/Login" style={{ color: '#000', fontWeight: '600', textDecoration: 'underline' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
