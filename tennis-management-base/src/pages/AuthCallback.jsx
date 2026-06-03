// Import React hooks used for running code after render and storing error messages
import { useEffect, useState } from 'react';
// Import navigation hook so the user can be redirected after verification
import { useNavigate } from 'react-router-dom';
// Import the Supabase client used for authentication and database requests
import { supabase } from '../supabaseClient';
// Import the background image used on the verification page
import background from '../assets/background.webp';
// Import the logo displayed at the top left of the page
import logo from '/logo.png';

// AuthCallback handles the email verification redirect page
export default function AuthCallback() {
  // Creates the navigate function used to move users to another page
  const navigate = useNavigate();
  // Stores any verification error message that needs to be shown on screen
  const [error, setError] = useState('');

  // Runs once when this page loads to check the current Supabase session
  useEffect(() => {
    // Handles the verification callback process from Supabase
    const handleCallback = async () => {
      // Gets the current authenticated session after the verification link is opened
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Shows an error message if the session could not be found or has failed
      if (sessionError || !session) {
        setError('Verification failed. The link may have expired. Please try registering again.');
        return;
      }

      // Reads the user's role from their Supabase metadata
      const role = session.user.user_metadata?.role;

      // Sends coaches to the coach dashboard after successful verification
      if (role === 'coach') {
        navigate('/CoachDashboard');
      // Sends players to the player dashboard after successful verification
      } else if (role === 'player') {
        navigate('/PlayerDashboard');
          // Checks whether the verified player already has a player_details row
          const { data, error } = await supabase
          .from('player_details')
          .select('id')
          .eq('id', session.user.id)
          .single();

          // Creates a default player_details row if one does not already exist
          if (!data) {
              await supabase.from('player_details').insert({
                  id: session.user.id,
                  strengths: [],
                  weaknesses: [],
              });
          }

      } else {
        // Fallback if role is missing
        navigate('/Login');
      }
    };

    // Starts the callback handling function
    handleCallback();
  }, [navigate]);

  // Displays the verification page while Supabase confirms the session
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

// Stores all inline styles used by the AuthCallback page
const styles = {
  // Full-screen page layout for centring the verification card
  page: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // Background image stretched across the full screen
  bg: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 },
  // Logo positioned in the top-left corner
  logo: { position: 'absolute', top: '24px', left: '24px', width: '52px', height: '52px', objectFit: 'contain', zIndex: 2 },
  // Main verification card container
  card: { position: 'relative', zIndex: 2, width: '430px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' },
  // Orange card header area
  cardHeader: { backgroundColor: '#C8714E', padding: '22px 20px', textAlign: 'center' },
  // VERIFYING title styling
  cardTitle: { margin: 0, fontFamily: 'Bebas, sans-serif', fontSize: '32px', color: '#ffffff', letterSpacing: '2px' },
  // White content area inside the card
  cardBody: { backgroundColor: '#ffffff', padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  // Loading spinner shown while verification is processing
  spinner: {
    width: '40px', height: '40px',
    border: '4px solid #DDDBD6',
    borderTop: '4px solid #C8714E',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  // Message shown while the account is being confirmed
  msg: { fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#6B6760', textAlign: 'center' },
  // Error message styling if verification fails
  errorText: { fontFamily: 'DM Sans Light, sans-serif', fontSize: '14px', color: '#DC2626', textAlign: 'center' },
  // Button styling for returning to the register page
  btn: { padding: '12px 24px', background: '#C8714E', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'Bebas, sans-serif', fontSize: '18px', letterSpacing: '2px', cursor: 'pointer' },
};
