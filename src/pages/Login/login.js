import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { authService } from '../../services/apiService';
import logo from "../../images/Baylor_Athletics_logo.svg.png";

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
        if (data.message === 'Login successful' || token) {
          if (token) {
            localStorage.setItem('token', token);
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
    <div id="auth-page-scoped">
      <div className="auth-container">
        <div className="auth-card shadow-lg border-0">
          <div className="auth-logo-wrapper mb-4">
            <img src={logo} alt="Baylor logo" className="auth-logo-img" />
          </div>
          <h2 className="auth-heading">Welcome Back</h2>
          <p className="auth-subtext">Please log in to the Teaching Evaluation system</p>
          
          {error && <div className="auth-error-message animated shake">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group-v3">
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
            
            <div className="input-group-v3 mb-4">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-control-v3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-baylor-gold w-100" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                  SIGNING IN...
                </>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>

          <div className="auth-footer mt-4">
            <span className="auth-text text-muted">Don't have an account? </span>
            <Link to="/signup" className="auth-link-v3">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;