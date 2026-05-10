import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [role, setRole] = useState('Coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state to track password visibility
  const [showPassword, setShowPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = () => {
    if (email && !emailRegex.test(email)) {
      setEmailError('Invalid email, please try again');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsSubmitting(true);
    console.log(`Logging in ${email} as ${role}`);
    
    // Add your Supabase login logic here

    setIsSubmitting(false);
  };

  return (
    <div className="card login-card">
      <div className="card-header">Log in</div>
      <div className="card-body">
        
        <div className="toggle-container">
          <button 
            type="button" 
            className={`toggle-btn ${role === 'Coach' ? 'active' : ''}`}
            onClick={() => setRole('Coach')}
          >
            Coach
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${role === 'Player' ? 'active' : ''}`}
            onClick={() => setRole('Player')}
          >
            Player
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              onBlur={validateEmail}
              style={{ borderColor: emailError ? '#d93025' : '' }}
              required 
            />
            {emailError && (
              <span style={{ color: '#d93025', fontSize: '12px', display: 'block', marginTop: '-3px' }}>
                {emailError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1" // Prevents the tab key from focusing the icon while typing
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <button type="button" className="forgot-password">Forgot password</button>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="keepLoggedIn" />
            <label htmlFor="keepLoggedIn" className="checkbox-label">Keep me logged in</label>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="register-prompt">
          Don't have an account? <Link to="/register" className="register-link">Register</Link>
        </div>
      </div>
    </div>
  );
}