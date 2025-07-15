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
//  console.log("Available localStorage keys:", Object.fromEntries(Object.entries(localStorage)));

  useEffect(() => {
    const storedUsername = localStorage.getItem('firstName');
//    console.log(storedUsername)
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
          <Nav.Link as={Link} to="/settings" className="nav-link-icon">
            <Gear size={40} className="mr-1" /> Settings
          </Nav.Link>
        </Nav>
        <Nav className="ml-auto">
          {localStorage.getItem('firstName') && (
            <Navbar.Text className="mr-3">
              Hi, <strong>{localStorage.getItem('firstName')}</strong>
            </Navbar.Text>
          )}
          <Nav.Link as={Link} to="/notifications" className="nav-link-icon">
           <Bell size={40} className="mr-1" /> Notifications
          </Nav.Link>
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
