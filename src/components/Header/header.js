// Header.js
import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Link } from 'react-router-dom';
import { House, FileText, QuestionCircle } from 'react-bootstrap-icons';
import logo from "../../images/Baylor-University-Logo.jpg";
import './header.css';

const Header = () => {
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
          <Nav.Link as={Link} to="/" className="nav-link-icon">
            <House size={40} className="mr-1" /> Home
          </Nav.Link>
          <Nav.Link as={Link} to="/reports" className="nav-link-icon">
            <FileText size={40} className="mr-1" /> Reports
          </Nav.Link>
          <Nav.Link as={Link} to="/help" className="nav-link-icon">
            <QuestionCircle size={40} className="mr-1" /> Help
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
