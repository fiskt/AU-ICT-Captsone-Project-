import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import background from '../assets/background.webp';
import logo from '../assets/logo.png';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Verification failed. The link may have expired. Please try registering again.');
        return;
      }

      const role = session.user.user_metadata?.role;

      if (role === 'coach') {
        navigate('/CoachDashboard');
      } else if (role === 'player') {
        navigate('/PlayerDashboard');
      } else {
        // Fallback if role is missing
        navigate('/Login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={styles.page}>
      <img src={background} alt="" style={styles.bg} />
      <img src={logo} alt="Logo" style={styles.logo} />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.cardTitle}>VERIFYING</h1>
        </div>
        <div style={styles.cardBody}>
          {error ? (
            <>
              <p style={styles.errorText}>{error}</p>
              <button
                onClick={() => navigate('/Register')}
                style={styles.btn}
              >
                Back to Register
              </button>
            </>
          ) : (
            <>
              <div style={styles.spinner} />
              <p style={styles.msg}>Confirming your account, please wait...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  logo: { position: 'absolute', top: '24px', left: '24px', width: '52px', height: '52px', objectFit: 'contain', zIndex: 2 },
  card: { position: 'relative', zIndex: 2, width: '430px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' },
  cardHeader: { backgroundColor: '#C8714E', padding: '22px 20px', textAlign: 'center' },
  cardTitle: { margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: '32px', color: '#ffffff', letterSpacing: '2px' },
  cardBody: { backgroundColor: '#ffffff', padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  spinner: {
    width: '40px', height: '40px',
    border: '4px solid #DDDBD6',
    borderTop: '4px solid #C8714E',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  msg: { fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#6B6760', textAlign: 'center' },
  errorText: { fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#DC2626', textAlign: 'center' },
  btn: { padding: '12px 24px', background: '#C8714E', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer' },
};
