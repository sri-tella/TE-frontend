import React, { useState, useEffect } from 'react';
import Header from '../../components/Header/header';
import './profile.css'; 
import { authService, adminService } from '../../services/apiService';
import { PersonCircle, ShieldLock, Mailbox, PersonBadge, ArrowRightCircle } from 'react-bootstrap-icons';

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
      <div id="profile-page-scoped">
        <div className="profile-hero-section text-center mb-5">
            <h1 className="profile-main-title">My Profile</h1>
            <p className="profile-sub-title">Manage your account information and security</p>
        </div>

        <div className="container">
          <div className="row justify-content-center">
            
            {/* Account Details Card */}
            <div className="col-lg-5 mb-4">
              <div className="profile-card h-100 shadow-sm border-0">
                <div className="profile-card-header d-flex align-items-center mb-4">
                  <PersonCircle className="header-icon mr-3" />
                  <h2 className="mb-0">Account Details</h2>
                </div>
                
                <div className="profile-form">
                  <div className="input-group-custom">
                    <label><PersonBadge className="mr-2" /> First Name</label>
                    <input type="text" className="form-control read-only-input" value={firstName} readOnly />
                  </div>
                  <div className="input-group-custom">
                    <label><PersonBadge className="mr-2" /> Last Name</label>
                    <input type="text" className="form-control read-only-input" value={lastName} readOnly />
                  </div>
                  <div className="input-group-custom">
                    <label><Mailbox className="mr-2" /> Email Address</label>
                    <input type="email" className="form-control read-only-input" value={email} readOnly />
                  </div>
                </div>

                {role === "INSTRUCTOR" && !requestSubmitted && (
                    <div className="role-request-box mt-auto pt-4 border-top">
                      <p className="text-muted small">Want to evaluate others?</p>
                      <button className="btn btn-outline-baylor w-100" onClick={handleRequestDualRole} disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Request Observer Access'}
                      </button>
                    </div>
                )}
              </div>
            </div>

            {/* Change Password Card */}
            <div className="col-lg-5 mb-4">
              <div className="profile-card h-100 shadow-sm border-0">
                <div className="profile-card-header d-flex align-items-center mb-4">
                  <ShieldLock className="header-icon mr-3" />
                  <h2 className="mb-0">Security</h2>
                </div>

                <div className="profile-form">
                  <div className="input-group-custom">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="form-control"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="input-group-custom">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="input-group-custom">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <button 
                    className="btn btn-baylor-gold mt-auto" 
                    onClick={handleChangePassword}
                    disabled={isLoading}
                  >
                    {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'} <ArrowRightCircle className="ml-2" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;