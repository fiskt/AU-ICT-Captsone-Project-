// Import React hooks for state and lifecycle behaviour
import { useState, useEffect } from 'react';
// Import navigation helper for redirecting after password reset
import { useNavigate } from 'react-router-dom';
// Import Supabase client for authentication actions
import { supabase } from '../supabaseClient';
// Import logo and visual assets used on the reset password screen
import logo from '/logo.png';
import checkmarkIcon from '../assets/checkmark.png';
import background from '../assets/background.webp';

// Password requirement rules used to validate the new password
const checks = [
  { id: 'length',  label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'case',    label: 'Uppercase and lowercase letters', test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: 'number',  label: 'At least one number (0–9)',       test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Special character (! @ # $ %)',   test: (p) => /[!@#$%^&*]/.test(p) },
];

// Custom hook that tracks the current browser window width
function useWindowWidth() {
  // Store the current window width in state
  const [width, setWidth] = useState(window.innerWidth);
  // Update the stored width whenever the browser window is resized
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

// Main reset password page component
export default function ResetPassword() {
  // Store the new password entered by the user
  const [password, setPassword] = useState('');
  // Store the confirmation password entered by the user
  const [confirmPassword, setConfirmPassword] = useState('');
  // Control whether the new password field is visible
  const [showPass, setShowPass] = useState(false);
  // Control whether the confirm password field is visible
  const [showConfirm, setShowConfirm] = useState(false);
  // Track whether the password update request is currently running
  const [loading, setLoading] = useState(false);
  // Store any validation or Supabase error message
  const [error, setError] = useState('');
  // Track whether the password has been updated successfully
  const [done, setDone] = useState(false);
  // Navigation function used to redirect the user back to login
  const navigate = useNavigate();

  // Get the current screen width for responsive styling
  const width = useWindowWidth();
  // Responsive layout checks for mobile and tablet screen sizes
  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 768;
  // Responsive sizing values used throughout the page
  const cardWidth = isMobile ? '92vw' : isTablet ? '420px' : '430px';
  const cardPad   = isMobile ? '20px 18px 24px' : '28px 36px 32px';
  const titleSize = isMobile ? '26px' : '32px';
  const logoSize  = isMobile ? '36px' : '52px';
  const logoTop   = isMobile ? '14px' : '24px';
  const logoLeft  = isMobile ? '14px' : '24px';

  // Run each password requirement against the current password
  const passChecks = checks.map((c) => ({ ...c, passed: c.test(password) }));
  // Confirm whether all password requirements have passed
  const allChecksPassed = passChecks.every((c) => c.passed);

  // Shared input styling used for both password fields
  const sharedInput = {
    width: '100%', padding: '10px 12px',
    fontSize: isMobile ? '16px' : '14px',
    fontFamily: 'DM Sans Light, sans-serif',
    border: '2px solid #DDDBD6', borderRadius: '8px',
    outline: 'none', boxSizing: 'border-box',
    color: '#000', background: '#fff',
  };

  // Supabase sets the session automatically via the URL hash when user clicks reset link
  // Handles the reset password form submission
  const handleReset = async (e) => {
    // Stop the browser from refreshing the page on form submit
    e.preventDefault();
    // Clear any previous error before validating again
    setError('');
    // Make sure both password fields are filled in
    if (!password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    // Make sure the password meets all listed requirements
    if (!allChecksPassed) { setError('Password does not meet all requirements.'); return; }
    // Make sure both password entries match
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    // Show the loading state while Supabase updates the password
    setLoading(true);
    // Send the new password to Supabase for the currently authenticated reset session
    const { error: updateError } = await supabase.auth.updateUser({ password });
    // Display any Supabase update error and stop loading
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    // Stop loading after a successful password update
    setLoading(false);
    // Show the success message screen
    setDone(true);
    // Redirect back to the login page after a short delay
    setTimeout(() => navigate('/Login'), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: isMobile ? 'auto' : 'hidden', textAlign: 'left', padding: isMobile ? '60px 0 20px' : 0 }}>
      <img src={background} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      <img src={logo} alt="Logo" style={{ position: 'fixed', top: logoTop, left: logoLeft, width: logoSize, height: logoSize, objectFit: 'contain', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 2, width: cardWidth, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ backgroundColor: '#C8714E', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: titleSize, color: '#fff', letterSpacing: '2px' }}>
            RESET PASSWORD
          </h1>
        </div>

        <div style={{ backgroundColor: '#fff', padding: cardPad }}>
          {done ? (
            <>
              <img src={checkmarkIcon} alt="Success" style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '14px', fontFamily: 'DM Sans Light, sans-serif', color: '#000', textAlign: 'center', marginBottom: '8px' }}>
                <strong>Password updated successfully!</strong>
              </p>
              <p style={{ fontSize: '13px', fontFamily: 'DM Sans Light, sans-serif', color: '#6B6760', textAlign: 'center' }}>
                Redirecting you to the login page...
              </p>
            </>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* New password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...sharedInput, paddingRight: '60px' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 }}>
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
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
                <label style={{ fontFamily: 'DM Mono Light, sans-serif', fontSize: '13px', color: '#6B6760' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ ...sharedInput, paddingRight: '60px' }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontFamily: 'DM Sans Light, sans-serif', fontSize: '13px', color: '#A09D96', cursor: 'pointer', padding: 0 }}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && <p style={{ margin: 0, fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans Light, sans-serif' }}>{error}</p>}

              <button type="submit" disabled={loading}
                style={{ marginTop: '6px', width: '100%', padding: isMobile ? '12px' : '14px', background: '#C8714E', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: isMobile ? '18px' : '20px', letterSpacing: '2px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
