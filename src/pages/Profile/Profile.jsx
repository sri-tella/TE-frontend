import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { authApi } from '../../api/authApi';
import { ShieldLock, EnvelopeFill, PersonFill, Eye, EyeSlash, KeyFill, ArrowRightShort, EyeFill, MortarboardFill, ArrowLeftRight, CheckCircleFill } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';

const AVATAR_COLORS = ['#1a2535','#2a3d68','#0e7490','#1d4ed8','#1b6ca8','#7b2d8b','#b5451b','#0891b2'];
const getAvatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (name) => {
  const p = name.trim().split(' ').filter(Boolean);
  if (!p.length) return '?';
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const ROLE_LABELS = { ADMIN: 'Administrator', OBSERVER: 'Observer', INSTRUCTOR: 'Instructor' };

const ROLE_OPTIONS = [
  {
    value: 'OBSERVER',
    icon: <EyeFill size={22} />,
    label: 'Observer',
    desc: 'Conduct evaluations & generate reports',
  },
  {
    value: 'INSTRUCTOR',
    icon: <MortarboardFill size={22} />,
    label: 'Instructor',
    desc: 'Complete questionnaires & view your reports',
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, setActiveRole } = useAuthStore();
  const firstName = user?.firstName || '';
  const lastName  = user?.lastName  || '';
  const email     = user?.email     || '';
  const roles     = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const role      = roles[0] || '';
  const userId    = user?.id || user?.userId;
  const fullName  = `${firstName} ${lastName}`.trim() || 'User';
  const activeRole = user?.activeRole || '';

  const [oldPassword,     setOldPassword]     = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld,         setShowOld]         = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [roleSaving,      setRoleSaving]      = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      if (err.message?.includes('403')) { toast.error('Not authorized.'); logout(); }
      else toast.error(`Failed: ${err.message || 'Unknown error'}`);
    },
  });

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) return toast.warning('All fields are required.');
    if (newPassword !== confirmPassword) return toast.warning('New passwords do not match.');
    changePasswordMutation.mutate({ email, oldPassword, newPassword, confirmPassword });
  };

  const handleRoleSwitch = async (newRole) => {
    if (newRole === activeRole || roleSaving) return;
    setRoleSaving(true);
    try {
      await authApi.setActiveRole(userId, newRole);
      setActiveRole(newRole);
      toast.success(`Switched to ${newRole === 'INSTRUCTOR' ? 'Instructor' : 'Observer'} view`);
      navigate(newRole === 'INSTRUCTOR' ? '/ins-home' : '/obs-home');
    } catch {
      toast.error('Could not switch role. Please try again.');
    } finally {
      setRoleSaving(false);
    }
  };

  const isAdmin = roles.includes('ADMIN');
  const showRoleSwitcher = !isAdmin;

  return (
    <div id="profile-page-scoped">
      <div className="prof-mesh" />

      {/* HEADER */}
      <div className="prof-header">
        <h1 className="prof-title">My Profile</h1>
        <p className="prof-subtitle">Account information &amp; settings</p>
      </div>

      <div className="prof-wrap">
        <div className="prof-grid">

          {/* ── ROLE SWITCHER CARD ── */}
          {showRoleSwitcher && (
            <div className="prof-card prof-card--role">
              <div className="prof-role-head">
                <div className="prof-role-head-left">
                  <div className="prof-role-head-icon"><ArrowLeftRight size={18} /></div>
                  <div>
                    <div className="prof-role-head-title">Active Role</div>
                    <div className="prof-role-head-sub">Switch between Observer and Instructor view</div>
                  </div>
                </div>
              </div>

              <div className="prof-role-cards">
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`prof-role-card${activeRole === r.value ? ' prof-role-card--active' : ''}`}
                    onClick={() => handleRoleSwitch(r.value)}
                    disabled={roleSaving}
                  >
                    <div className="prof-role-card-icon">{r.icon}</div>
                    <div className="prof-role-card-label">{r.label}</div>
                    <div className="prof-role-card-desc">{r.desc}</div>
                    {activeRole === r.value && (
                      <CheckCircleFill size={14} className="prof-role-card-check" />
                    )}
                  </button>
                ))}
              </div>

              {roleSaving && <div className="prof-role-saving">Saving…</div>}
            </div>
          )}

          {/* ── ACCOUNT CARD ── */}
          <div className="prof-card">
            <div className="prof-avatar-wrap">
              <div className="prof-avatar" style={{ background: getAvatarColor(fullName) }}>
                {getInitials(fullName)}
              </div>
              <div className="prof-avatar-info">
                <div className="prof-avatar-name">{fullName}</div>
                <span className="prof-role-badge">{ROLE_LABELS[activeRole] || ROLE_LABELS[role] || role}</span>
              </div>
            </div>

            <div className="prof-divider" />

            <div className="prof-section-label">Account Details</div>

            <div className="prof-info-rows">
              <div className="prof-info-row">
                <span className="prof-info-icon"><PersonFill size={13} /></span>
                <div className="prof-info-content">
                  <div className="prof-info-key">First Name</div>
                  <div className="prof-info-val">{firstName || '—'}</div>
                </div>
              </div>
              <div className="prof-info-row">
                <span className="prof-info-icon"><PersonFill size={13} /></span>
                <div className="prof-info-content">
                  <div className="prof-info-key">Last Name</div>
                  <div className="prof-info-val">{lastName || '—'}</div>
                </div>
              </div>
              <div className="prof-info-row">
                <span className="prof-info-icon"><EnvelopeFill size={13} /></span>
                <div className="prof-info-content">
                  <div className="prof-info-key">Email Address</div>
                  <div className="prof-info-val">{email || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECURITY CARD ── */}
          <div className="prof-card">
            <div className="prof-card-head">
              <div className="prof-card-head-icon"><ShieldLock size={20} /></div>
              <div className="prof-card-head-text">
                <div className="prof-card-head-title">Security</div>
                <div className="prof-card-head-sub">Change your password</div>
              </div>
            </div>

            <div className="prof-divider" />

            <div className="prof-fields">
              <div className="prof-field">
                <label className="prof-label">Current Password</label>
                <div className="prof-input-wrap">
                  <span className="prof-input-icon"><KeyFill size={13} /></span>
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="prof-input"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                  <button type="button" className="prof-eye-btn" onClick={() => setShowOld(v => !v)} tabIndex={-1}>
                    {showOld ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="prof-field">
                <label className="prof-label">New Password</label>
                <div className="prof-input-wrap">
                  <span className="prof-input-icon"><KeyFill size={13} /></span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="prof-input"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button type="button" className="prof-eye-btn" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                    {showNew ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="prof-field">
                <label className="prof-label">Confirm New Password</label>
                <div className="prof-input-wrap">
                  <span className="prof-input-icon"><KeyFill size={13} /></span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="prof-input"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" className="prof-eye-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeSlash size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              className="prof-btn prof-btn--solid"
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending
                ? <span className="prof-spinner" />
                : <><span>Update Password</span><ArrowRightShort size={22} /></>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
