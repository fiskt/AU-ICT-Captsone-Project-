import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '/logo.png';
import emailIcon from '../assets/email.png';
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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const width = useWindowWidth();
  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 768;
  const cardWidth = isMobile ? '92vw' : isTablet ? '420px' : '430px';
  const cardPad   = isMobile ? '20px 18px 24px' : '28px 36px 32px';
  const titleSize = isMobile ? '26px' : '32px';
  const logoSize  = isMobile ? '36px' : '52px';
  const logoTop   = isMobile ? '14px' : '24px';
  const logoLeft  = isMobile ? '14px' : '24px';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/ResetPassword`,
    });
    if (resetError) { setError(resetError.message); setLoading(false); return; }
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'left' }}>
      <img src={background} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <img src={logo} alt="Logo" style={{ position: 'fixed', top: logoTop, left: logoLeft, width: logoSize, height: logoSize, objectFit: 'contain', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 2, width: cardWidth, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ backgroundColor: '#C8714E', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: titleSize, color: '#fff', letterSpacing: '2px' }}>
            FORGOT PASSWORD
          </h1>
        </div>

        <div style={{ backgroundColor: '#fff', padding: cardPad }}>
          {sent ? (
            <>
              <img src={emailIcon} alt="Email" style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000', textAlign: 'center', marginBottom: '12px' }}>
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <p style={{ fontSize: '13px', fontFamily: 'DM Sans Light, sans-serif', color: '#6B6760', textAlign: 'center', marginBottom: '10px' }}>
                Click the link in the email to reset your password. Check your spam folder if you don't see it.
              </p>
              <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' }}>
                <Link to="/Login" style={{ color: '#000', fontWeight: '600', textDecoration: 'underline' }}>Back to Log in</Link>
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 20px', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#6B6760' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: isMobile ? '16px' : '14px', fontFamily: 'DM Sans Light, sans-serif', border: '2px solid #DDDBD6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff' }}
                  />
                </div>

                {error && <p style={{ margin: 0, fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}

                <button type="submit" disabled={loading}
                  style={{ marginTop: '6px', width: '100%', padding: isMobile ? '12px' : '14px', background: '#C8714E', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '18px' : '20px', letterSpacing: '2px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
              </form>

              <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' }}>
                Remember your password?{' '}
                <Link to="/Login" style={{ color: '#000', fontWeight: '600', textDecoration: 'underline' }}>Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
