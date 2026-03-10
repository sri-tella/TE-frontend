import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalPlus, CheckCircleFill, BookHalf } from 'react-bootstrap-icons';
import { useAuthStore } from '../../store/authStore';
import './InsHome.css'; 

const InsHome = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formFilled, setFormFilled] = useState(false);

  useEffect(() => {
    // Check if class info exists for this instructor (logic adapted from old project)
    const hasSubmitted = localStorage.getItem(`instructorFormSubmitted_${user?.id}`) === 'true';
    setFormFilled(hasSubmitted);
  }, [user]);

  const handleFillForm = () => {
    navigate('/instructor-intro');
  };

  return (
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
  );
};

export default InsHome;
