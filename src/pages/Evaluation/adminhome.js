import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import '../Navbar/home.css';

const AdmHome = () => {
  const firstName = localStorage.getItem('firstName');

  return (
    <>
      <Header />
      <div className="home-container">
        <h1 className="home-heading">Welcome, {firstName} (Admin) to the Teaching Observation Application</h1>
        <h2>This is your dashboard. Use the settings in the navigation bar to manage accounts or perform admin tasks.</h2>
      </div>
    </>
  );
};

export default AdmHome;