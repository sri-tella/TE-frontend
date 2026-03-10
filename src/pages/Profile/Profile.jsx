import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import './Profile.css'; 
import { authApi } from '../../api/authApi';
import { adminApi } from '../../api/adminApi';
import { PersonCircle, ShieldLock, Mailbox, PersonBadge, ArrowRightCircle } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

const Profile = () => {
  const { user, logout } = useAuthStore();
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const email = user?.email || '';
  const role = Array.isArray(user?.roles) ? user?.roles[0] : user?.role || '';
  const userId = user?.id || user?.userId;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (passwordData) => authApi.changePassword(passwordData),
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      if (err.message?.includes('403')) {
        toast.error('Failed: You are not authorized.');
        logout();
      } else {
        toast.error(`Failed: ${err.message || 'Unknown error'}`);
      }
    }
  });

  const requestRoleMutation = useMutation({
    mutationFn: (id) => adminApi.requestDualRole(id),
    onSuccess: (data) => {
      toast.success(data || "Request submitted successfully!");
      setRequestSubmitted(true);
    },
    onError: () => toast.error("Request error")
  });

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warning('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('New passwords do not match.');
      return;
    }
    changePasswordMutation.mutate({ email, oldPassword, newPassword, confirmPassword });
  };

  const isLoading = changePasswordMutation.isPending || requestRoleMutation.isPending;

  return (
    <div id="profile-page-scoped">
      <div className="profile-hero-section text-center mb-4">
          <h1 className="profile-main-title">My Profile</h1>
          <p className="profile-sub-title">Manage your account information and security</p>
      </div>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 mb-4">
            <div className="profile-card h-100 shadow-sm border-0">
              <div className="profile-card-header d-flex align-items-center mb-4">
                <PersonCircle className="header-icon me-3" />
                <h2 className="mb-0">Account Details</h2>
              </div>
              <div className="profile-form">
                <div className="input-group-custom">
                  <label><PersonBadge className="me-2" /> First Name</label>
                  <input type="text" className="form-control read-only-input" value={firstName} readOnly />
                </div>
                <div className="input-group-custom">
                  <label><PersonBadge className="me-2" /> Last Name</label>
                  <input type="text" className="form-control read-only-input" value={lastName} readOnly />
                </div>
                <div className="input-group-custom">
                  <label><Mailbox className="me-2" /> Email Address</label>
                  <input type="email" className="form-control read-only-input" value={email} readOnly />
                </div>
              </div>
              {role === "INSTRUCTOR" && !requestSubmitted && (
                  <div className="role-request-box mt-auto pt-4 border-top">
                    <button className="btn btn-outline-baylor w-100" onClick={() => requestRoleMutation.mutate(userId)} disabled={isLoading}>
                      {requestRoleMutation.isPending ? 'Sending...' : 'Request Observer Access'}
                    </button>
                  </div>
              )}
            </div>
          </div>
          <div className="col-lg-5 mb-4">
            <div className="profile-card h-100 shadow-sm border-0">
              <div className="profile-card-header d-flex align-items-center mb-4">
                <ShieldLock className="header-icon me-3" />
                <h2 className="mb-0">Security</h2>
              </div>
              <div className="profile-form">
                <div className="input-group-custom">
                  <label>Current Password</label>
                  <input type="password" placeholder="••••••••" className="form-control" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                </div>
                <div className="input-group-custom">
                  <label>New Password</label>
                  <input type="password" placeholder="New password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="input-group-custom">
                  <label>Confirm Password</label>
                  <input type="password" placeholder="Confirm" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <button className="btn btn-baylor-gold mt-auto" onClick={handleChangePassword} disabled={isLoading}>
                  {changePasswordMutation.isPending ? 'UPDATING...' : 'UPDATE PASSWORD'} <ArrowRightCircle className="ms-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
