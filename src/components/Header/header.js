// Header.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Link } from 'react-router-dom';
import { House, FileText, QuestionCircle, BoxArrowRight, Gear, Person, Bell } from 'react-bootstrap-icons';
import logo from "../../images/Baylor-University-Logo.jpg";
import './header.css';

const Header = () => {

const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const storedRole = localStorage.getItem('role');

  useEffect(() => {
    const storedUsername = localStorage.getItem('firstName');
//    console.log(storedRole)
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/');
  };

  const fetchNotifications = () => {
//    console.log(storedRole);
    const roleArray = storedRole.split(',').map(r => r.trim());
    const allNotifications = [];
    for (const role of roleArray) {
        fetch(`https://te-backend-production.up.railway.app/api/notifications/role/${role}`)
                .then(res => res.json())
                .then(data => setNotifications(data))
                .catch(err => console.error("Error fetching notifications:", err));
        }
    };

  const handleMarkAsRead = (id) => {
    fetch(`https://te-backend-production.up.railway.app/api/notifications/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => setNotifications(prev => prev.filter(n => n.id !== id)))
      .catch(err => console.error("Error marking notification as read:", err));
  };

  return (
    <Navbar className="navbar" variant="dark" expand="lg">
      <Navbar.Brand as={Link} to="/home">
        <img
          src={logo}
          width="200"
          height="100"
          className="d-inline-block align-top"
          alt="Logo"
        />{' '}
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link as={Link} to="/home" className="nav-link-icon">
            <House size={40} className="mr-1" /> Home
          </Nav.Link>
          <Nav.Link as={Link} to="/reports" className="nav-link-icon">
            <FileText size={40} className="mr-1" /> Reports
          </Nav.Link>
          <Nav.Link as={Link} to="/help" className="nav-link-icon">
            <QuestionCircle size={40} className="mr-1" /> Help
          </Nav.Link>
          {role === 'ADMIN' && (
          <Nav.Link as={Link} to="/settings" className="nav-link-icon">
          <Gear size={40} className="mr-1" /> Settings
          </Nav.Link>
          )}
        </Nav>
        <Nav className="ml-auto">
          {localStorage.getItem('firstName') && (
            <Navbar.Text className="mr-3">
              Hi, <strong>{localStorage.getItem('firstName')}</strong>
            </Navbar.Text>
          )}
          {(
            <div className="nav-link-icon notification-container" style={{ position: 'relative' }}>
              <Bell
                size={40}
                className="notification-bell"
                onClick={() => setShowDropdown(!showDropdown)}
              />
              {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
              {showDropdown && (
                <div className="notification-dropdown">
                  {notifications.length === 0 ? (
                    <p>No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <span>{n.message}</span>
                        <button onClick={() => handleMarkAsRead(n.id)} className="delete-notification">X</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <Nav.Link as={Link} to="/myprofile" className="nav-link-icon">
             <Person size={40} className="mr-1" /> Profile
          </Nav.Link>
          <button onClick={handleLogout} className="nav-logout-button">
            <BoxArrowRight size={40} className="mr-1" /> Logout
          </button>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
