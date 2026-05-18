import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';
import background from '../assets/background.webp';

const checks = [
  { id: 'length',  label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'case',    label: 'Uppercase and lowercase letters', test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number (0–9)',       test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special character (! @ # $ %)',   test: (p) => /[!@#$%^&*]/.test(p) },
];

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

  const passChecks = checks.map((c) => ({ ...c, passed: c.test(password) }));
  const allChecksPassed = passChecks.every((c) => c.passed);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (role === 'coach' && !email.endsWith('@tennis.com.au')) {
      setError('This email is not authorised to register as a coach.');
      return;
    }
    if (!allChecksPassed) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After clicking the confirmation link, Supabase redirects here
        emailRedirectTo: 'http://localhost:5173/auth/callback',
        data: {
          role,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Insert into signin_details — non-blocking
    await supabase.from('signin_details').insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role,
    });

    setLoading(false);
    setRegistered(true); // Show "check your email" screen
  };

  if (registered) {
    return (
      <div style={styles.page}>
        <img src={background} alt="" style={styles.bg} />
        <img src={logo} alt="Logo" style={styles.logo} />

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.cardTitle}>CHECK YOUR EMAIL</h1>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.emailIcon}>📧</div>
            <p style={styles.emailMsg}>
              We've sent a confirmation link to <strong>{email}</strong>.
            </p>
            <p style={styles.emailSub}>
              Click the link in the email to verify your account and you'll be taken straight to your dashboard.
            </p>
            <p style={styles.emailSub} >
              Didn't receive it? Check your spam folder or{' '}
              <span
                style={{ color: '#C8714E', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setRegistered(false)}
              >
                try again
              </span>.
            </p>
            <p style={styles.switchText}>
              Already verified?{' '}
              <Link to="/Login" style={styles.switchLink}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <img src={background} alt="" style={styles.bg} />
      <img src={logo} alt="Logo" style={styles.logo} />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.cardTitle}>REGISTER</h1>
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

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.nameRow}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} />
              </div>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} />
              </div>
            </div>

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
              <div style={styles.reqBox}>
                {passChecks.map((c) => (
                  <div key={c.id} style={styles.reqRow}>
                    <span style={{ ...styles.reqDot, background: c.passed ? '#16a34a' : '#DC2626' }} />
                    <span style={{ ...styles.reqText, color: c.passed ? '#16a34a' : '#DC2626' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Re-enter password</label>
              <div style={styles.passwordWrap}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: '60px' }}
                />
                <button type="button" style={styles.showBtn} onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p style={styles.errorText}>{error}</p>}

            <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>

          <p style={styles.switchText}>
            Already have an account?{' '}
            <Link to="/Login" style={styles.switchLink}>Log in</Link>
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
  emailIcon: { fontSize: '48px', textAlign: 'center', marginBottom: '16px' },
  emailMsg: { fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000', textAlign: 'center', marginBottom: '12px' },
  emailSub: { fontSize: '13px', fontFamily: 'DM Sans Light, sans-serif', color: '#6B6760', textAlign: 'center', marginBottom: '10px' },
  roleToggle: { display: 'flex', borderRadius: '8px', border: '2px solid #DDDBD6', overflow: 'hidden', marginBottom: '20px' },
  roleBtn: { flex: 1, padding: '12px 0', fontSize: '15px', fontFamily: 'DM Sans Light, sans-serif', fontWeight: '500', border: 'none', background: 'transparent', color: '#6B6760', cursor: 'pointer', transition: 'background 0.2s' },
  roleBtnActive: { background: '#ffffff', color: '#000000', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  nameRow: { display: 'flex', gap: '12px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' },
  input: { width: '100%', padding: '10px 12px', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', border: '2px solid #DDDBD6', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#000', background: '#fff' },
  passwordWrap: { position: 'relative' },
  showBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 },
  reqBox: { background: '#FAF9F7', border: '1.5px solid #DDDBD6', borderRadius: '8px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' },
  reqRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  reqDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, transition: 'background 0.2s' },
  reqText: { fontSize: '12px', fontFamily: 'DM Sans Light, sans-serif', transition: 'color 0.2s' },
  submitBtn: { marginTop: '6px', width: '100%', padding: '14px', background: '#C8714E', color: '#ffffff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '20px', letterSpacing: '2px', cursor: 'pointer', transition: 'background 0.2s' },
  errorText: { margin: 0, fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' },
  switchText: { marginTop: '20px', textAlign: 'center', fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000' },
  switchLink: { color: '#000', fontWeight: '600', textDecoration: 'underline' },
};
