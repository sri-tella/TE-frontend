import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import './adminsettings.css';
import { API_BASE_URL } from '../../constants';

const ProfilePage = () => {
  // Auto-populate user details from localStorage
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState('');

  console.log('userId in localStorage:', localStorage.getItem('userId'));

  useEffect(() => {
    setFirstName(localStorage.getItem('firstName') || '');
    setLastName(localStorage.getItem('lastName') || '');
    setEmail(localStorage.getItem('email') || '');
  }, []);

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    const userEmail = localStorage.getItem('email');

    fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        oldPassword,
        newPassword,
        confirmPassword
      }),
    })
      .then(res => res.text())
      .then(message => {
        alert(message);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch(err => alert('Error changing password: ' + err));
  };

      const role = localStorage.getItem('role');
      function handleRequestDualRole() {
        fetch(`${API_BASE_URL}/api/admins/roleRequests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: localStorage.getItem('userId'),
            requestedRole: 'OBSERVER'
          })
        })
        .then(res => res.text())
        .then(message => {
              alert(message);
              setRequestSubmitted(true);
            })
        .catch(console.error);
      }

  return (
    <>
      <Header />
      <div className="admin-container">
        <h2>My Profile</h2>

        <div className="admin-form">
          <h4>Account Details</h4>
          <input
            type="text"
            value={firstName}
            placeholder="First Name"
            readOnly
          />
          <input
            type="text"
            value={lastName}
            placeholder="Last Name"
            readOnly
          />
          <input
            type="email"
            value={email}
            placeholder="Email"
            readOnly
          />
        </div>

        <div className="admin-form">
          <h4>Change Password</h4>
          <input
            type="password"
            placeholder="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button onClick={handleChangePassword}>Update Password</button>
        </div>
        <div>
          {role === "INSTRUCTOR" && !requestSubmitted && (
            <div className="admin-form">
              <p>In order to become an observer, please request access here:</p>
              <button onClick={handleRequestDualRole}>
                Request Observer Access
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
