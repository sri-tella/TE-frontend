import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    fetch('https://te-backend-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Login successful') {
            localStorage.setItem('observerId', data.observerId);
            console.log(data.observerId);
//            localStorage.setItem('token', data.token);
            navigate('/home');
        } else {
          alert('Invalid credentials');
        }
      })
      .catch(error => {
              console.error('Error during login:', error);
              alert('An error occurred during login');
            });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-heading">Login</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-button">Login</button>
        </form>
        <a href="/signup" className="auth-link"> Don't have an account? Sign Up </a>
      </div>
    </div>
  );
};

export default Login;
