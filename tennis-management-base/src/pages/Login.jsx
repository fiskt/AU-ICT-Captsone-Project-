import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '/logo.png';
import background from '../assets/background.webp';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

export default function Login() {
  const [role, setRole] = useState('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const width = useWindowWidth();

  // Breakpoints
  const isMobile  = width < 480;
  const isTablet  = width >= 480 && width < 768;
  const isDesktop = width >= 768;

  const cardWidth  = isMobile ? '92vw' : isTablet ? '420px' : '430px';
  const cardPad    = isMobile ? '20px 18px 24px' : '28px 36px 32px';
  const titleSize  = isMobile ? '26px' : '32px';
  const logoSize   = isMobile ? '36px' : '52px';
  const logoTop    = isMobile ? '14px' : '24px';
  const logoLeft   = isMobile ? '14px' : '24px';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (role === 'coach' && !email.endsWith('@tennis.com.au')) {
      setError('This email is not authorised to log in as a coach.'); return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const userRole = data.user.user_metadata?.role;
    if (userRole !== role) {
      setError(`This account is registered as a ${userRole}, not a ${role}.`);
      await supabase.auth.signOut(); setLoading(false); return;
    }

    setLoading(false);
    navigate(role === 'coach' ? '/CoachDashboard' : '/PlayerDashboard');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: isMobile ? 'auto' : 'hidden', textAlign: 'left', padding: isMobile ? '60px 0 20px' : 0 }}>
      <img src={background} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <img src={logo} alt="Logo" style={{ position: 'fixed', top: logoTop, left: logoLeft, width: logoSize, height: logoSize, objectFit: 'contain', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 2, width: cardWidth, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#C8714E', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: titleSize, color: '#fff', letterSpacing: '2px' }}>LOG IN</h1>
        </div>

        {/* Body */}
        <div style={{ backgroundColor: '#fff', padding: cardPad }}>
          {/* Role toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', border: '2px solid #DDDBD6', overflow: 'hidden', marginBottom: '20px' }}>
            {['coach', 'player'].map((r) => (
              <button key={r} type="button"
                style={{ flex: 1, padding: isMobile ? '10px 0' : '12px 0', fontSize: isMobile ? '14px' : '15px', fontFamily: 'DM Sans Light, sans-serif', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'background 0.2s', background: role === r ? '#fff' : 'transparent', color: role === r ? '#000' : '#6B6760', boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.12)' : 'none' }}
                onClick={() => { setRole(r); setError(''); }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: isMobile ? '16px' : '14px', fontFamily: 'DM Sans Light, sans-serif', border: '2px solid #DDDBD6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 60px 10px 12px', fontSize: isMobile ? '16px' : '14px', fontFamily: 'DM Sans Light, sans-serif', border: '2px solid #DDDBD6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <Link to="/ForgotPassword" style={{ fontFamily: 'DM Sans Light, sans-serif', fontSize: '12px', color: '#C8714E', textDecoration: 'none', textAlign: 'left' }}>
                Forgot password?
              </Link>
            </div>

            {error && <p style={{ margin: 0, fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ marginTop: '6px', width: '100%', padding: isMobile ? '12px' : '14px', background: '#C8714E', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '18px' : '20px', letterSpacing: '2px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' }}>
            Don't have an account?{' '}
            <Link to="/Register" style={{ color: '#000', fontWeight: '600', textDecoration: 'underline' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}