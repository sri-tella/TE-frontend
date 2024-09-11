// Header.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Link } from 'react-router-dom';
import { House, FileText, QuestionCircle, BoxArrowRight } from 'react-bootstrap-icons';
import logo from "../../images/Baylor-University-Logo.jpg";
import './header.css';

const Header = () => {

const navigate = useNavigate();
  const [username, setUsername] = useState('');

  // Assuming username is stored in local storage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <Navbar className="navbar" variant="dark" expand="lg">
      <Navbar.Brand as={Link} to="/">
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
        </Nav>
        <Nav className="ml-auto">
          {username && (
            <Navbar.Text className="mr-3">
              Hi, <strong>{username}</strong>
            </Navbar.Text>
          )}
          <button onClick={handleLogout} className="nav-logout-button">
            <BoxArrowRight size={40} className="mr-1" /> Logout
          </button>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
