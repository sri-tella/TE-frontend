import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { API_BASE_URL } from '../../constants';

const Signup = () => {
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (email !== confirmEmail) {
      setError('Emails do not match');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!role) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);

    fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstname,
        lastName: lastname,
        email, 
        password,
        roles: [role]
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Signup failed');
        return response.json();
      })
      .then(data => {
        if (data.id) {
          navigate('/'); // Redirect to login
        } else {
          setError('Signup failed. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error during signup:', error);
        setError('Signup failed: ' + error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <h2 className="auth-heading">Create Account</h2>
        <p className="auth-subtext">Join us today!</p>
        
        {error && <div className="auth-error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          
          {/* Row for First Name and Last Name */}
          <div className="form-row">
            <div className="input-group half-width">
              <label>First Name</label>
              <input
                type="text"
                placeholder="First Name"
                className="auth-input"
                value={firstname}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="input-group half-width">
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                className="auth-input"
                value={lastname}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Email</label>
            <input
              type="email"
              placeholder="Confirm your email"
              className="auth-input"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="input-group half-width">
              <label>Password</label>
              <input
                type="password"
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group half-width">
              <label>Confirm</label>
              <input
                type="password"
                placeholder="Confirm"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Select Role</label>
            <select 
              className="auth-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>Choose a role...</option>
              <option value="OBSERVER">Observer</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn auth-button w-100 text-center" 
            disabled={isLoading}
          >
            {isLoading ? (
               <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                CREATING ACCOUNT...
               </>
            ) : (
              'SIGN UP'
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          <span className="auth-text">Already have an account? </span>
          <Link to="/" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;