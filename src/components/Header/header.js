import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { House, FileText, QuestionCircle, BoxArrowRight, Gear, Person, Bell } from 'react-bootstrap-icons';
import logo from "../../images/Baylor_Athletics_logo.svg.png";
import './header.css';
import { API_BASE_URL } from '../../constants';

const Header = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const storedRole = localStorage.getItem('role');

  useEffect(() => {
    const storedUsername = localStorage.getItem('firstName');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedRole) {
      setRole(storedRole);
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [storedRole]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const fetchNotifications = () => {
    if (!storedRole) return;
    const roleArray = storedRole.split(',').map(r => r.trim());
    
    roleArray.forEach(r => {
        fetch(`${API_BASE_URL}/api/notifications/role/${r}`)
            .then(res => res.json())
            .then(data => setNotifications(prev => [...prev, ...data]))
            .catch(err => console.error(err));
    });
  };

  const handleMarkAsRead = (id) => {
    fetch(`${API_BASE_URL}/api/notifications/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => setNotifications(prev => prev.filter(n => n.id !== id)))
      .catch(err => console.error(err));
  };

  return (
    <Navbar className="custom-navbar" expand="lg" variant="dark">
      <Container fluid className="px-4">
        
        <Navbar.Brand as={Link} to="/home" className="brand-logo-container">
          <img
            src={logo}
            alt="Baylor University"
            className="logo-img"
          />
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-between">
          
          <Nav className="nav-left-block">
            <Nav.Link as={Link} to="/home" className="nav-item-link">
              <House size={20} className="nav-icon" /> Home
            </Nav.Link>
            <Nav.Link as={Link} to="/reports" className="nav-item-link">
              <FileText size={20} className="nav-icon" /> Reports
            </Nav.Link>
            <Nav.Link as={Link} to="/help" className="nav-item-link">
              <QuestionCircle size={20} className="nav-icon" /> Help
            </Nav.Link>
            {role === 'ADMIN' && (
              <Nav.Link as={Link} to="/settings" className="nav-item-link">
                <Gear size={20} className="nav-icon" /> Settings
              </Nav.Link>
            )}
          </Nav>

          <Nav className="nav-right-block align-items-center">
            {username && (
              <span className="welcome-text">
                Hi, <strong>{username}</strong>
              </span>
            )}

            <div className="notification-wrapper">
              <div className="nav-icon-btn" onClick={() => setShowDropdown(!showDropdown)}>
                <Bell size={22} />
                {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </div>
              
              {showDropdown && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="no-notifications">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <span className="notif-message">{n.message}</span>
                        <button onClick={() => handleMarkAsRead(n.id)} className="btn-close-notif">&times;</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <Nav.Link as={Link} to="/myprofile" className="nav-item-link profile-link">
               <Person size={24} className="nav-icon" /> Profile
            </Nav.Link>
            
            <button onClick={handleLogout} className="logout-btn">
              <BoxArrowRight size={20} className="nav-icon" /> Logout
            </button>
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;