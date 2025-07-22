import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import '../Navbar/home.css';

const InsHome = () => {
  const navigate = useNavigate();
  const [formFilled, setFormFilled] = useState(false);
  const [roles, setRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState('INSTRUCTOR');

  useEffect(() => {
    const hasSubmitted = localStorage.getItem('instructorFormSubmitted') === 'true';
    setFormFilled(hasSubmitted);

    const storedRoles = localStorage.getItem('role');
        if (storedRoles) {
          const parsedRoles = storedRoles.split(',').map(role => role.trim().toUpperCase());
          setRoles(parsedRoles);
        }

    const activeRole = localStorage.getItem('activeRole') || 'INSTRUCTOR';
    setCurrentRole(activeRole);
  }, []);

  const handleFillForm = () => {
    navigate('/InstructorIntro');
  };

  return (
    <>
      <Header />
      <div className="home-container">
        <h1 className="home-heading">Welcome to Teaching Observation Application</h1>
        {!formFilled ? (
          <>
            <h2>Please complete your course/session details.</h2>
            <button className="start-evaluation-link" onClick={handleFillForm}>
              Fill in Form
            </button>
          </>
        ) : (
          <h2>Thank you for submitting your form!</h2>
        )}
      </div>
    </>
  );
};

export default InsHome;
