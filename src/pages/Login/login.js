import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { API_BASE_URL } from '../../constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data.message === 'Login successful') {
          localStorage.setItem('userId', data.id);
          localStorage.setItem('firstName', data.firstName);
          localStorage.setItem('lastName', data.lastName);
          localStorage.setItem('email', data.email);
          
          const role = data.roles.replace('[', '').replace(']', '');
          localStorage.setItem('role', role);

          if (role === 'OBSERVER') {
             navigate('/obshome');
          } else if (role === 'INSTRUCTOR') {
             navigate('/inshome');
          } else {
             navigate('/home');
          }
        } else {
          setError('Invalid email or password');
        }
      })
      .catch(error => {
        console.error(error);
        setError('Server error. Please try again later.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-heading">Welcome Back</h2>
        <p className="auth-subtext">Please log in to your account</p>
        
        {error && <div className="auth-error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn auth-button w-100 text-center" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                SIGNING IN...
              </>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-text">Don't have an account? </span>
          <Link to="/signup" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;