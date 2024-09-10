import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

const Signup = () => {
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(''); // Default role
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (email !== confirmEmail) {
      alert('Emails do not match');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    fetch('https://te-backend-production.up.railway.app/api/auth/signup', {
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
        if (!response.ok) {
          throw new Error('Signup failed');
        }
        return response.json();
      })
      .then(data => {
        if (data.id) {
          navigate('/');
        } else {
          alert('Signup failed');
        }
      })
      .catch(error => {
        console.error('Error during signup:', error);
        alert('Signup failed: ' + error.message);
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-heading">Sign Up</h2>
        <form className="auth-form" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Firstname"
            className="auth-input"
            value={firstname}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Lastname"
            className="auth-input"
            value={lastname}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="email"
            placeholder="Confirm Email"
            className="auth-input"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <select 
            className="auth-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="" disabled>Select role</option>
            <option value="OBSERVER">Observer</option>
            <option value="INSTRUCTOR">Instructor</option>
          </select>
          <button type="submit" className="auth-button">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
