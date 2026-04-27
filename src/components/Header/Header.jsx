import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useRoles } from '../../hooks/useRoles';
import { notificationApi } from '../../api/notificationApi';
import logo from '../../assets/logo.png';
import { 
  House, 
  FileText, 
  QuestionCircle, 
  BoxArrowRight, 
  Gear, 
  Person, 
  Bell 
} from 'react-bootstrap-icons';
import './header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { roles, hasRole } = useRoles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDropdown, setShowDropdown] = useState(false);

  // 2. Fetch notifications for all roles
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', roles],
    queryFn: async () => {
      if (roles.length === 0) return [];
      const results = await Promise.all(
        roles.map(role => notificationApi.fetchByRole(role))
      );
      // Flatten and remove duplicates (by id)
      const all = results.flat();
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      return unique;
    },
    enabled: isAuthenticated && roles.length > 0,
    refetchInterval: 60000, // Poll every minute
  });

  // 3. Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMarkAsRead = (e, id) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const username = user?.firstName || user?.firstname || user?.email?.split('@')[0] || '';
  const isAdmin = hasRole('ADMIN');

  return (
    <Navbar className="custom-navbar" expand="lg">
      <Container fluid className="px-4">
        
        <Navbar.Brand as={Link} to="/" className="brand-logo-container">
          <img
            src={logo}
            alt="Baylor University"
            className="logo-img"
          />
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          
          <Nav className="nav-left-block">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item-link active" : "nav-item-link"}>
              <House size={18} className="nav-icon" /> Home
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => isActive ? "nav-item-link active" : "nav-item-link"}>
              <FileText size={18} className="nav-icon" /> Reports
            </NavLink>
            <NavLink to="/help" className={({isActive}) => isActive ? "nav-item-link active" : "nav-item-link"}>
              <QuestionCircle size={18} className="nav-icon" /> Help
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin-management" className={({isActive}) => isActive ? "nav-item-link active" : "nav-item-link"}>
                <Gear size={18} className="nav-icon" /> Settings
              </NavLink>
            )}
          </Nav>

          <Nav className="nav-right-block align-items-center">
            {username && (
              <div className="welcome-text">
                Hi, <strong>{username}</strong>
              </div>
            )}

            <div className="notification-wrapper">
              <div className="nav-icon-btn" onClick={() => setShowDropdown(!showDropdown)}>
                <Bell size={20} className="bi-bell" />
                {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </div>
              
              {showDropdown && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">Notifications</div>
                  <div className="notification-list-container">
                    {notifications.length === 0 ? (
                      <div className="no-notifications">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="notification-item">
                          <span className="notif-message">{n.message}</span>
                          <button 
                            onClick={(e) => handleMarkAsRead(e, n.id)} 
                            className="btn-close-notif"
                            disabled={markAsReadMutation.isPending}
                          >
                            &times;
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/profile" className={({isActive}) => isActive ? "nav-item-link active profile-link" : "nav-item-link profile-link"}>
               <Person size={22} className="nav-icon" /> Profile
            </NavLink>
            
            <button onClick={handleLogout} className="logout-btn">
              <BoxArrowRight size={18} className="nav-icon" /> Logout
            </button>
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
