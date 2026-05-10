import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Coach');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // States for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z\s\-']+$/;

  const pwd = formData.password;
  const reqs = {
    length: pwd.length >= 8,
    upperLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(pwd)
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' }); 
  };

  const validateName = (field, value) => {
    if (value && !nameRegex.test(value)) {
      setErrors(prev => ({ ...prev, [field]: `Invalid ${field.replace('Name', ' name')}` }));
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    const val = formData.email.toLowerCase();
    if (val && !emailRegex.test(val)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email, please try again' }));
      return false;
    }
    if (role === 'Coach' && val && !val.endsWith('@tennis.com.au')) {
      setErrors(prev => ({ ...prev, email: 'Not authorised to be used for registration as a Coach' }));
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const isFirstNameValid = validateName('firstName', formData.firstName);
    const isLastNameValid = validateName('lastName', formData.lastName);
    const isEmailValid = validateEmail();
    const isPasswordValid = Object.values(reqs).every(Boolean);

    if (isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid) {
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        
        console.log('Registering:', formData, 'as', role);
        // Add your Supabase registration call here
        navigate('/login');
    }
  };

  return (
    <div className="card">
      <div className="card-header">Register</div>
      <div className="card-body">
        
        <div className="toggle-container">
          <button 
            type="button" 
            className={`toggle-btn ${role === 'Coach' ? 'active' : ''}`}
            onClick={() => { setRole('Coach'); setTimeout(validateEmail, 0); }}
          >
            Coach
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${role === 'Player' ? 'active' : ''}`}
            onClick={() => { setRole('Player'); setTimeout(validateEmail, 0); }}
          >
            Player
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="name-row" style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                value={formData.firstName}
                onChange={handleChange}
                onBlur={(e) => validateName('firstName', e.target.value)}
                style={{ borderColor: errors.firstName ? '#d93025' : '' }}
                required 
              />
              {errors.firstName && <span style={{ color: '#d93025', fontSize: '12px', display: 'block', marginTop: '-3px' }}>{errors.firstName}</span>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                value={formData.lastName}
                onChange={handleChange}
                onBlur={(e) => validateName('lastName', e.target.value)}
                style={{ borderColor: errors.lastName ? '#d93025' : '' }}
                required 
              />
              {errors.lastName && <span style={{ color: '#d93025', fontSize: '12px', display: 'block', marginTop: '-3px' }}>{errors.lastName}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={formData.email}
              onChange={handleChange}
              onBlur={validateEmail}
              style={{ borderColor: errors.email ? '#d93025' : '' }}
              required 
            />
            {errors.email && <span style={{ color: '#d93025', fontSize: '12px', display: 'block', marginTop: '-3px' }}>{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={formData.password}
                onChange={handleChange}
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            <div className="password-reqs">
              <ul>
                <li className={reqs.length ? 'valid' : 'invalid'}>At least 8 characters</li>
                <li className={reqs.upperLower ? 'valid' : 'invalid'}>Uppercase and lowercase letters</li>
                <li className={reqs.number ? 'valid' : 'invalid'}>At least one number (0-9)</li>
                <li className={reqs.special ? 'valid' : 'invalid'}>Special character (! @ # $ %)</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Re-enter password</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                id="confirmPassword" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn">Register</button>
        </form>

        <div className="register-prompt">
          Already have an account? <Link to="/login" className="register-link">Log in</Link>
        </div>
      </div>
    </div>
  );
}