import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import './inshome.css'; 
import { JournalPlus, CheckCircleFill, BookHalf } from 'react-bootstrap-icons';

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
      <div id="inshome-page-scoped">
        <div className="ins-hero-section">
            <h1 className="ins-main-title">Instructor Dashboard</h1>
            <p className="ins-sub-title">Teaching Evaluation & Observation</p>
        </div>

        <div className="ins-card">
          <div className="ins-icon-wrapper">
            <BookHalf />
          </div>
          
          <h2 className="ins-card-heading">
            Welcome to the Observation Portal
          </h2>
          
          {!formFilled ? (
            <>
              <p className="ins-card-text">
                To begin, please provide your course and session details. This information helps observers conduct a thorough and constructive evaluation.
              </p>
              <button 
                className="btn btn-ins-primary" 
                onClick={handleFillForm}
              >
                <JournalPlus size={24} /> Start Session Setup
              </button>
            </>
          ) : (
            <div className="ins-success-badge">
              <CheckCircleFill size={28} />
              <span>Thank you! Your course details have been successfully submitted.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InsHome;