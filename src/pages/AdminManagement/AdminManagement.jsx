import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import {
  PersonPlusFill,
  ShieldFillCheck,
  PeopleFill,
  ClockHistory,
  Trash3,
  CheckCircleFill,
  PencilFill,
  XCircleFill,
  ArrowLeftRight,
} from 'react-bootstrap-icons';
import './AdminManagement.css';

const getInitials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

const AVATAR_COLORS = ['#1a2535', '#1e3a5f', '#0e1825', '#243450', '#1e2d5a'];
const getAvatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState({ firstName: '', lastName: '', email: '', role: 'OBSERVER' });

  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: adminApi.fetchAdmins,
  });

  const { data: roleRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['roleRequests'],
    queryFn: adminApi.fetchRoleRequests,
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: adminApi.fetchAllUsers,
  });

  const addAdminMutation = useMutation({
    mutationFn: adminApi.addAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      queryClient.invalidateQueries(['allUsers']);
      setNewAdmin({ firstName: '', lastName: '', email: '', role: 'OBSERVER' });
      toast.success('User added successfully!');
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const deleteAdminMutation = useMutation({
    mutationFn: adminApi.deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      toast.success('Admin deleted successfully');
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: adminApi.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['roleRequests']);
      toast.success('Request approved successfully!');
    },
  });

  const toggleContentPermissionMutation = useMutation({
    mutationFn: ({ userId, canEditContent }) =>
      adminApi.toggleContentPermission(userId, canEditContent),
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success('Permission updated');
    },
    onError: () => toast.error('Failed to update permission'),
  });

  const toggleRoleSwitchMutation = useMutation({
    mutationFn: (userId) => adminApi.toggleRoleSwitch(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['allUsers']);
      toast.success('Role access updated');
    },
    onError: () => toast.error('Failed to update role access'),
  });

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email) {
      toast.warning('Please fill in all fields');
      return;
    }
    addAdminMutation.mutate(newAdmin);
  };

  const handleDeleteAdmin = (id) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      deleteAdminMutation.mutate(id);
    }
  };

  const getRoleLabel = (roles = []) => {
    if (roles.includes('OBSERVER') && roles.includes('INSTRUCTOR')) return 'Observer + Instructor';
    if (roles.includes('OBSERVER')) return 'Observer';
    if (roles.includes('INSTRUCTOR')) return 'Instructor';
    return roles.join(', ');
  };

  return (
    <div id="admin-management-scoped">
      <div className="am-page-header">
        <h2 className="am-page-title">Account Management</h2>
        <p className="am-page-subtitle">Manage users, permissions, and role requests</p>
      </div>

      <div className="am-content">

        {/* ── Add User Form ── */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon"><PersonPlusFill size={16} /></div>
            <h4>Add New User</h4>
          </div>
          <form onSubmit={handleAddAdmin} className="am-form">
            <div className="am-form-row">
              <div className="am-form-group">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="am-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="am-form-row">
              <div className="am-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                />
              </div>
              <div className="am-form-group">
                <label>Role</label>
                <select
                  className="am-select"
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  <option value="OBSERVER">Observer</option>
                  <option value="INSTRUCTOR">Instructor</option>
                </select>
              </div>
            </div>
            <button type="submit" className="am-btn-primary" disabled={addAdminMutation.isPending}>
              {addAdminMutation.isPending ? <Spinner size="sm" /> : <><PersonPlusFill size={14} /> Add User</>}
            </button>
          </form>
        </div>

        {/* ── Current Admins ── */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon"><ShieldFillCheck size={16} /></div>
            <h4>Current Administrators</h4>
            {!isLoadingAdmins && <span className="am-count-badge">{admins.length}</span>}
          </div>
          {isLoadingAdmins ? (
            <div className="am-loading"><Spinner variant="success" /></div>
          ) : admins.length === 0 ? (
            <p className="am-empty">No administrators found.</p>
          ) : (
            <div className="am-user-list">
              {admins.map((admin) => (
                <div key={admin.id} className="am-user-card">
                  <div className="am-avatar" style={{ background: getAvatarColor(admin.firstName) }}>
                    {getInitials(admin.firstName, admin.lastName)}
                  </div>
                  <div className="am-user-info">
                    <span className="am-user-name">{admin.firstName} {admin.lastName}</span>
                    <span className="am-user-email">{admin.email}</span>
                  </div>
                  <span className="am-role-badge am-role-admin">Admin</span>
                  <button
                    className="am-btn-danger"
                    onClick={() => handleDeleteAdmin(admin.id)}
                    disabled={deleteAdminMutation.isPending}
                    title="Delete administrator"
                  >
                    <Trash3 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── User Access Management ── */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon"><PeopleFill size={16} /></div>
            <h4>User Access Management</h4>
            {!isLoadingUsers && <span className="am-count-badge">{allUsers.length}</span>}
          </div>
          <p className="am-card-desc">
            Toggle role switching and content editing permissions for each user.
          </p>
          {isLoadingUsers ? (
            <div className="am-loading"><Spinner variant="success" /></div>
          ) : allUsers.length === 0 ? (
            <p className="am-empty">No users found.</p>
          ) : (
            <div className="am-user-list">
              {allUsers.map((user) => (
                <div key={user.id} className="am-user-card am-user-card--wide">
                  <div className="am-avatar" style={{ background: getAvatarColor(user.firstName) }}>
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div className="am-user-info">
                    <span className="am-user-name">{user.firstName} {user.lastName}</span>
                    <span className="am-user-email">{user.email}</span>
                    <span className="am-user-role-hint">{getRoleLabel(user.roles)}</span>
                  </div>

                  <div className="am-user-actions">
                    <button
                      className={user.canSwitchRoles ? 'am-btn-warning' : 'am-btn-role'}
                      disabled={toggleRoleSwitchMutation.isPending}
                      onClick={() => toggleRoleSwitchMutation.mutate(user.id)}
                      title={user.canSwitchRoles ? 'Revoke role switching' : 'Allow role switching'}
                    >
                      <ArrowLeftRight size={13} />
                      {user.canSwitchRoles ? ' Revoke Switch' : ' Allow Switch'}
                    </button>

                    <button
                      className={user.canEditContent ? 'am-btn-warning' : 'am-btn-success'}
                      disabled={toggleContentPermissionMutation.isPending}
                      onClick={() =>
                        toggleContentPermissionMutation.mutate({
                          userId: user.id,
                          canEditContent: !user.canEditContent,
                        })
                      }
                    >
                      {user.canEditContent
                        ? <><XCircleFill size={13} /> Revoke Edit</>
                        : <><PencilFill size={13} /> Grant Edit</>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pending Role Requests ── */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon am-icon-pending"><ClockHistory size={16} /></div>
            <h4>Pending Role Requests</h4>
            {!isLoadingRequests && roleRequests.length > 0 && (
              <span className="am-count-badge am-count-pending">{roleRequests.length}</span>
            )}
          </div>
          {isLoadingRequests ? (
            <div className="am-loading"><Spinner variant="success" /></div>
          ) : roleRequests.length === 0 ? (
            <p className="am-empty">No pending requests.</p>
          ) : (
            <div className="am-user-list">
              {roleRequests.map((request) => (
                <div key={request.id} className="am-user-card">
                  <div className="am-avatar" style={{ background: getAvatarColor(request.firstName || request.firstname) }}>
                    {getInitials(request.firstName || request.firstname, request.lastName || request.lastname)}
                  </div>
                  <div className="am-user-info">
                    <span className="am-user-name">
                      {request.firstName || request.firstname} {request.lastName || request.lastname}
                    </span>
                    <span className="am-user-email">{request.email}</span>
                  </div>
                  <span className="am-role-badge am-role-pending">Pending</span>
                  <button
                    className="am-btn-success"
                    onClick={() => approveRequestMutation.mutate(request.id)}
                    disabled={approveRequestMutation.isPending}
                  >
                    <CheckCircleFill size={13} /> Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminManagement;
