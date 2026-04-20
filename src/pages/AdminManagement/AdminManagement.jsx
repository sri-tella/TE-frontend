import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import './AdminManagement.css';

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState({ firstName: '', lastName: '', email: '' });

  // 1. Fetching data
  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: adminApi.fetchAdmins
  });

  const { data: roleRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ['roleRequests'],
    queryFn: adminApi.fetchRoleRequests
  });

  // 2. Mutations
  const addAdminMutation = useMutation({
    mutationFn: adminApi.addAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      setNewAdmin({ firstName: '', lastName: '', email: '' });
      toast.success("Admin added successfully!");
    },
    onError: (err) => toast.error(`Error: ${err.message}`)
  });

  const deleteAdminMutation = useMutation({
    mutationFn: adminApi.deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(['admins']);
      toast.success("Admin deleted successfully");
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: adminApi.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(['roleRequests']);
      toast.success("Request approved successfully!");
    }
  });

  const { data: observers = [], isLoading: isLoadingObservers } = useQuery({
    queryKey: ['observers'],
    queryFn: adminApi.fetchObservers
  });

  const togglePermissionMutation = useMutation({
    mutationFn: ({ userId, canEditContent }) => adminApi.toggleContentPermission(userId, canEditContent),
    onSuccess: () => {
      queryClient.invalidateQueries(['observers']);
      toast.success("Permission updated");
    },
    onError: () => toast.error("Failed to update permission")
  });

  // 3. Handlers
  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email) {
      toast.warning("Please fill in all fields");
      return;
    }
    addAdminMutation.mutate(newAdmin);
  };

  const handleDeleteAdmin = (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      deleteAdminMutation.mutate(id);
    }
  };

  const handleApproveRequest = (requestId) => {
    approveRequestMutation.mutate(requestId);
  };

  return (
    <div id="admin-management-scoped">
      <h2>Account Management</h2>

      {/* Form to add admin */}
      <div className="admin-form">
        <h4>Add New Administrator</h4>
        <form onSubmit={handleAddAdmin}>
          <input
            type="text"
            placeholder="First Name"
            value={newAdmin.firstName}
            onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newAdmin.lastName}
            onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            required
          />
          <button type="submit" disabled={addAdminMutation.isPending}>
            {addAdminMutation.isPending ? <Spinner size="sm" /> : "Add Administrator"}
          </button>
        </form>
      </div>

      {/* Current Admins List */}
      <div className="admin-list">
        <h4>Current Administrators</h4>
        {isLoadingAdmins ? (
          <div className="text-center p-3"><Spinner variant="success" /></div>
        ) : (
          <ul>
            {admins.length === 0 ? <p className="text-muted">No admins found.</p> : admins.map(admin => (
              <li key={admin.id}>
                <span className="admin-info">
                  <strong>{admin.firstName} {admin.lastName}</strong> - {admin.email}
                </span>
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteAdmin(admin.id)}
                  disabled={deleteAdminMutation.isPending}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Observers Content Edit Permission */}
      <div className="admin-list">
        <h4>Content Edit Permission (Observers)</h4>
        {isLoadingObservers ? (
          <div className="text-center p-3"><Spinner variant="success" /></div>
        ) : (
          <ul>
            {observers.length === 0 ? (
              <p className="text-muted">No observers found.</p>
            ) : (
              observers.map(observer => (
                <li key={observer.id}>
                  <span className="admin-info">
                    <strong>{observer.firstName} {observer.lastName}</strong> — {observer.email}
                  </span>
                  <button
                    className={observer.canEditContent ? 'delete-button' : 'approve-button'}
                    disabled={togglePermissionMutation.isPending}
                    onClick={() => togglePermissionMutation.mutate({
                      userId: observer.id,
                      canEditContent: !observer.canEditContent
                    })}
                  >
                    {observer.canEditContent ? 'Revoke Edit' : 'Grant Edit'}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Pending Requests List */}
      <div className="admin-list">
        <h4>Pending Role Requests (Observer)</h4>
        {isLoadingRequests ? (
          <div className="text-center p-3"><Spinner variant="success" /></div>
        ) : (
          <ul>
            {roleRequests.length === 0 ? (
              <p className="text-muted">No pending requests.</p>
            ) : (
              roleRequests.map(request => (
                <li key={request.id}>
                  <span className="admin-info">
                    <strong>{request.firstName || request.firstname} {request.lastName || request.lastname}</strong> - {request.email}
                  </span>
                  <button 
                    className="approve-button" 
                    onClick={() => handleApproveRequest(request.id)}
                    disabled={approveRequestMutation.isPending}
                  >
                    Approve
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
