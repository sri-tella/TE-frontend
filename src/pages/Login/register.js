import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { API_BASE_URL } from '../../constants';
import logo from "../../images/Baylor_Athletics_logo.svg.png";

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
          navigate('/');
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
    <div id="auth-page-scoped">
      <div className="auth-container">
        <div className="auth-card signup-card shadow-lg border-0">
          <div className="auth-logo-wrapper mb-4 text-center">
            <img src={logo} alt="Baylor logo" className="auth-logo-img" />
          </div>
          <h2 className="auth-heading text-center">Create Account</h2>
          <p className="auth-subtext text-center">Join the Teaching Evaluation system</p>
          
          {error && <div className="auth-error-message animated shake">{error}</div>}

          <form className="auth-form" onSubmit={handleSignup}>
            
            <div className="form-row-v3 d-flex gap-3 mb-3">
              <div className="input-group-v3 flex-grow-1">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  className="form-control-v3"
                  value={firstname}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group-v3 flex-grow-1">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  className="form-control-v3"
                  value={lastname}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group-v3 mb-3">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="example@baylor.edu"
                className="form-control-v3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group-v3 mb-3">
              <label>Confirm Email</label>
              <input
                type="email"
                placeholder="Confirm your email"
                className="form-control-v3"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row-v3 d-flex gap-3 mb-3">
              <div className="input-group-v3 flex-grow-1">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  className="form-control-v3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-group-v3 flex-grow-1">
                <label>Confirm</label>
                <input
                  type="password"
                  placeholder="Confirm"
                  className="form-control-v3"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group-v3 mb-4">
              <label>Choose Your Role</label>
              <select 
                className="form-control-v3 select-v3"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="" disabled>Select a role...</option>
                <option value="OBSERVER">Observer</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-baylor-gold w-100" 
              disabled={isLoading}
            >
              {isLoading ? (
                 <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  CREATING ACCOUNT...
                 </>
              ) : (
                'SIGN UP'
              )}
            </button>
          </form>
          
          <div className="auth-footer text-center mt-4">
            <span className="auth-text text-muted">Already have an account? </span>
            <Link to="/" className="auth-link-v3">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;