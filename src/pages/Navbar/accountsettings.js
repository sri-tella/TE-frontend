import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/header';
import './adminsettings.css';

const AccountManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [roleRequests, setRoleRequests] = useState('');

  useEffect(() => {
  // Fetching the current admins from backend
    fetch('https://te-backend-production.up.railway.app/api/admins')
      .then(res => res.json())
      .then(data => setAdmins(data))
      .catch(err => console.error('Error fetching admins:', err));

  // Fetching the current roleRequests from backend
    fetch('https://te-backend-production.up.railway.app/api/admins/roleRequests')
       .then(res => res.json())
       .then(data => setRoleRequests(data))
       .catch(err => console.error('Error fetching roleRequests:', err))
  }, []);

  const handleAddAdmin = () => {

  if (!newAdminFirstName.trim() || !newAdminLastName.trim() || !newAdminEmail.trim()) {
      alert('Please fill in all fields');
      return;
     }

    fetch('https://te-backend-production.up.railway.app/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: newAdminFirstName.trim(), lastName: newAdminLastName.trim(), email: newAdminEmail.trim() }),
    })
      .then(res => res.text())
      .then(data => {
        alert('Admin added successfully');
        return fetch('https://te-backend-production.up.railway.app/api/admins');
      })
      .then(res => res.json())
          .then(data => {
            setAdmins(data);
            setNewAdminFirstName('');
            setNewAdminLastName('');
            setNewAdminEmail('');
          })
      .catch(err => alert('Error adding admin: ' + err));
  };

  const handleDeleteAdmin = (id) => {

    const confirmDelete = window.confirm('Are you sure you want to delete this admin?');
    if (!confirmDelete) return;

    fetch(`https://te-backend-production.up.railway.app/api/admins/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        alert('Admin deleted successfully');
        return fetch('https://te-backend-production.up.railway.app/api/admins');
      })
      .then(res => res.json())
      .then(data => setAdmins(data))
      .catch(err => alert('Error deleting admin: ' + err));
  };

  const handleApproveRequest = (requestId) => {
    fetch(`https://te-backend-production.up.railway.app/api/admins/roleRequests/${requestId}/approve`, {
      method: 'POST'
    })
      .then(() => {
        alert('Request approved successfully');
        setRoleRequests(prev => prev.filter(r => r.id !== requestId));
      })
      .catch(err => alert('Error approving request: ' + err));
  };

  return (
    <>
      <Header />
      <div className="admin-container">
        <h2>Account Management</h2>

        <div className="admin-form">
          <h4>Add New Admin</h4>
          <input
              type="text"
              placeholder="First Name"
              value={newAdminFirstName}
              onChange={(e) => setNewAdminFirstName(e.target.value)}
              required
            />
          <input
              type="text"
              placeholder="Last Name"
              value={newAdminLastName}
              onChange={(e) => setNewAdminLastName(e.target.value)}
              required
            />
          <input
            type="email"
            placeholder="Email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            required
          />
          <button onClick={handleAddAdmin}>Add Admin</button>
        </div>

        <div className="admin-list">
          <h4>Current Admins</h4>
          <ul>
            {admins.map(admin => (
              <li key={admin.id} className="admin-item">
                <span className="admin-info">
                  <strong>{admin.firstName} {admin.lastName}</strong> - {admin.email}
                </span>
                <button className="delete-button" onClick={() => handleDeleteAdmin(admin.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-list">
          <h4>Pending Role Requests</h4>
          {roleRequests.length === 0 ? (
            <p>No pending requests.</p>
          ) : (
            <ul>
              {roleRequests.map(request => (
                <li key={request.id} className="admin-item">
                  <span className="admin-info">
                    <strong>{request.firstName} {request.lastName}</strong> - {request.email}
                  </span>
                  <button className="approve-button" onClick={() => handleApproveRequest(request.id)}>
                    Approve Observer Role
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </>
  );
};

export default AccountManagement;
