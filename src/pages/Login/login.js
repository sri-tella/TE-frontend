import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { authService } from '../../services/apiService';

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

    authService.login(email, password)
  .then(response => {
      const data = response.data;
      const token = data.token || data.accessToken || data.jwt; 
      console.log("Данные от token:", token);
      if (data.message === 'Login successful' || token) {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          console.error("ВНИМАНИЕ: Сервер не прислал токен! Проверьте бэкенд.");
        }
        
        localStorage.setItem('userId', data.instructorId);
        localStorage.setItem('firstName', data.firstName);
        localStorage.setItem('lastName', data.lastName);
        localStorage.setItem('email', data.email);
        
        const role = data.roles ? data.roles.replace(/[\[\]]/g, '') : '';
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
        console.error("Login error:", error);
        const message = error.response?.data?.message || 'Invalid email or password';
        setError(message);
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