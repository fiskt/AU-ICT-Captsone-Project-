import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';
import background from '../assets/background.webp';

export default function Login() {
  const [role, setRole] = useState('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (role === 'coach' && !email.endsWith('@tennis.com.au')) {
      setError('This email is not authorised to log in as a coach.');
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Role is stored in user_metadata at registration
    const userRole = data.user.user_metadata?.role;

    if (userRole !== role) {
      setError(`This account is registered as a ${userRole}, not a ${role}.`);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    if (role === 'coach') {
      navigate('/CoachDashboard');
    } else {
      navigate('/PlayerDashboard');
    }
  };

  return (
    <div style={styles.page}>
      <img src={background} alt="" style={styles.bg} />
      <img src={logo} alt="Logo" style={styles.logo} />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.cardTitle}>LOG IN</h1>
        </div>

        <div style={styles.cardBody}>
          <div style={styles.roleToggle}>
            <button
              style={{ ...styles.roleBtn, ...(role === 'coach' ? styles.roleBtnActive : {}) }}
              onClick={() => { setRole('coach'); setError(''); }}
              type="button"
            >
              Coach
            </button>
            <button
              style={{ ...styles.roleBtn, ...(role === 'player' ? styles.roleBtnActive : {}) }}
              onClick={() => { setRole('player'); setError(''); }}
              type="button"
            >
              Player
            </button>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: '60px' }}
                />
                <button type="button" style={styles.showBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <p style={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.switchLink}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'left' },
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  logo: { position: 'absolute', top: '24px', left: '24px', width: '52px', height: '52px', objectFit: 'contain', zIndex: 2 },
  card: { position: 'relative', zIndex: 2, width: '430px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' },
  cardHeader: { backgroundColor: '#C8714E', padding: '22px 20px', textAlign: 'center' },
  cardTitle: { margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: '32px', color: '#ffffff', letterSpacing: '2px' },
  cardBody: { backgroundColor: '#ffffff', padding: '28px 36px 32px' },
  roleToggle: { display: 'flex', borderRadius: '8px', border: '2px solid #DDDBD6', overflow: 'hidden', marginBottom: '24px' },
  roleBtn: { flex: 1, padding: '12px 0', fontSize: '15px', fontFamily: 'DM Sans Light, sans-serif', fontWeight: '500', border: 'none', background: 'transparent', color: '#6B6760', cursor: 'pointer', transition: 'background 0.2s' },
  roleBtnActive: { background: '#ffffff', color: '#000000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', border: '2px solid #DDDBD6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff' },
  passwordWrap: { position: 'relative' },
  showBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 },
  submitBtn: { marginTop: '8px', width: '100%', padding: '14px', background: '#C8714E', color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '20px', letterSpacing: '2px', cursor: 'pointer', transition: 'background 0.2s' },
  errorText: { margin: 0, fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' },
  switchText: { marginTop: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' },
  switchLink: { color: '#000', fontWeight: '600', textDecoration: 'underline' },
};
