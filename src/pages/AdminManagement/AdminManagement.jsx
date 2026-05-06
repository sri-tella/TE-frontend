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
} from 'react-bootstrap-icons';
import './AdminManagement.css';

const getInitials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

const AVATAR_COLORS = ['#154734', '#1a6348', '#0d4a2e', '#2a7a5a', '#0f5c3a'];
const getAvatarColor = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState({ firstName: '', lastName: '', email: '' });

  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: adminApi.fetchAdmins,
  });

  const { data: roleRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['roleRequests'],
    queryFn: adminApi.fetchRoleRequests,
  });

  const { data: observers = [], isLoading: isLoadingObservers } = useQuery({
    queryKey: ['observers'],
    queryFn: adminApi.fetchObservers,
  });

  const addAdminMutation = useMutation({
    mutationFn: adminApi.addAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      setNewAdmin({ firstName: '', lastName: '', email: '' });
      toast.success('Admin added successfully!');
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

  const togglePermissionMutation = useMutation({
    mutationFn: ({ userId, canEditContent }) =>
      adminApi.toggleContentPermission(userId, canEditContent),
    onSuccess: () => {
      queryClient.invalidateQueries(['observers']);
      toast.success('Permission updated');
    },
    onError: () => toast.error('Failed to update permission'),
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

  return (
    <div id="admin-management-scoped">
      <div className="am-page-header">
        <h2 className="am-page-title">Account Management</h2>
        <p className="am-page-subtitle">Manage administrators, permissions, and role requests</p>
      </div>

      <div className="am-content">

        {/* Add Admin Form */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon">
              <PersonPlusFill size={16} />
            </div>
            <h4>Add New Administrator</h4>
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
            <button type="submit" className="am-btn-primary" disabled={addAdminMutation.isPending}>
              {addAdminMutation.isPending ? <Spinner size="sm" /> : <><PersonPlusFill size={14} /> Add Administrator</>}
            </button>
          </form>
        </div>

        {/* Current Admins */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon">
              <ShieldFillCheck size={16} />
            </div>
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
                  <div
                    className="am-avatar"
                    style={{ background: getAvatarColor(admin.firstName) }}
                  >
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

        {/* Content Edit Permission */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon">
              <PeopleFill size={16} />
            </div>
            <h4>Content Edit Permission</h4>
            {!isLoadingObservers && <span className="am-count-badge">{observers.length}</span>}
          </div>
          <p className="am-card-desc">Allow observers to edit page content inline.</p>
          {isLoadingObservers ? (
            <div className="am-loading"><Spinner variant="success" /></div>
          ) : observers.length === 0 ? (
            <p className="am-empty">No observers found.</p>
          ) : (
            <div className="am-user-list">
              {observers.map((observer) => (
                <div key={observer.id} className="am-user-card">
                  <div
                    className="am-avatar"
                    style={{ background: getAvatarColor(observer.firstName) }}
                  >
                    {getInitials(observer.firstName, observer.lastName)}
                  </div>
                  <div className="am-user-info">
                    <span className="am-user-name">{observer.firstName} {observer.lastName}</span>
                    <span className="am-user-email">{observer.email}</span>
                  </div>
                  {observer.canEditContent ? (
                    <span className="am-role-badge am-role-edit">Can Edit</span>
                  ) : (
                    <span className="am-role-badge am-role-observer">Observer</span>
                  )}
                  <button
                    className={observer.canEditContent ? 'am-btn-warning' : 'am-btn-success'}
                    disabled={togglePermissionMutation.isPending}
                    onClick={() =>
                      togglePermissionMutation.mutate({
                        userId: observer.id,
                        canEditContent: !observer.canEditContent,
                      })
                    }
                  >
                    {observer.canEditContent ? (
                      <><XCircleFill size={13} /> Revoke</>
                    ) : (
                      <><PencilFill size={13} /> Grant</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Role Requests */}
        <div className="am-card">
          <div className="am-card-header">
            <div className="am-card-header-icon am-icon-pending">
              <ClockHistory size={16} />
            </div>
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
                  <div
                    className="am-avatar"
                    style={{ background: getAvatarColor(request.firstName || request.firstname) }}
                  >
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
