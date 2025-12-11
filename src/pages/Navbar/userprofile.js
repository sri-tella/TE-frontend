import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import './profile.css'; 
import { API_BASE_URL } from '../../constants';

const ProfilePage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
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
      .catch(err => alert('Error changing password: ' + err))
      .finally(() => setIsLoading(false));
  };

  const role = localStorage.getItem('role');
  
  function handleRequestDualRole() {
    setIsLoading(true);
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
    .catch(console.error)
    .finally(() => setIsLoading(false));
  }

  return (
    <>
      <Header />
      <div className="profile-container">
        <div className="profile-wrapper">
          
          <div className="profile-card">
            <h2 className="profile-heading">Account Details</h2>
            <div className="profile-form">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="profile-input read-only"
                  value={firstName}
                  readOnly
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="profile-input read-only"
                  value={lastName}
                  readOnly
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="profile-input read-only"
                  value={email}
                  readOnly
                />
              </div>
            </div>
            
            {/* Role Request Section */}
            {role === "INSTRUCTOR" && !requestSubmitted && (
                <div className="role-request-section">
                  <p className="role-text">Want to evaluate others?</p>
                  <button 
                    className="btn-secondary" 
                    onClick={handleRequestDualRole}
                    disabled={isLoading}
                  >
                    Request Observer Access
                  </button>
                </div>
            )}
          </div>

          <div className="profile-card">
            <h2 className="profile-heading">Change Password</h2>
            <div className="profile-form">
              <div className="input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="profile-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="profile-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="profile-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <button 
                className="btn profile-button text-center" 
                onClick={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProfilePage;