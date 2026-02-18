import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import './profile.css'; 
import { authService, adminService } from '../../services/apiService';

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

  const handleChangePassword = async () => {
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

    try {
      await authService.changePassword({
        email: userEmail,
        oldPassword,
        newPassword,
        confirmPassword
      });

      alert('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Change Password Error:", err);
      if (err.response?.status === 403) {
        alert('Failed: You are not authorized. Please log in again.');
      } else {
        alert(`Failed: ${err.response?.data || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const role = localStorage.getItem('role');
  
  const handleRequestDualRole = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const res = await adminService.requestDualRole(userId);
      alert(res.data || "Request submitted!");
      setRequestSubmitted(true);
    } catch (err) {
      console.error("Role Request Error:", err);
      alert(err.response?.status === 403 ? "Authorization failed" : "Request error");
    } finally {
      setIsLoading(false);
    }
  };

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
                <input type="text" className="profile-input read-only" value={firstName} readOnly />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input type="text" className="profile-input read-only" value={lastName} readOnly />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" className="profile-input read-only" value={email} readOnly />
              </div>
            </div>
            {role === "INSTRUCTOR" && !requestSubmitted && (
                <div className="role-request-section">
                  <p className="role-text">Want to evaluate others?</p>
                  <button className="btn-secondary" onClick={handleRequestDualRole} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Request Observer Access'}
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
                  autoComplete="current-password"
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
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