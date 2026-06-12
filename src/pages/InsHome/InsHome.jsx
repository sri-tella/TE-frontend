import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalPlus, CheckCircleFill, BookHalf, ArrowRightShort } from 'react-bootstrap-icons';
import { useAuthStore } from '../../store/authStore';
import './InsHome.css';

const InsHome = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formFilled, setFormFilled] = useState(false);

  useEffect(() => {
    const hasSubmitted = localStorage.getItem(`instructorFormSubmitted_${user?.id}`) === 'true';
    setFormFilled(hasSubmitted);
  }, [user]);

  return (
    <div id="inshome-page-scoped">
      <div className="ins-mesh" />

      <div className="ins-header">
        <h1 className="ins-title">Instructor Dashboard</h1>
        <p className="ins-subtitle">Teaching Evaluation &amp; Observation</p>
      </div>

      <div className="ins-wrap">
        <div className="ins-card">
          <div className="ins-icon-box">
            <BookHalf size={28} />
          </div>

          <h2 className="ins-card-heading">Welcome to the Observation Portal</h2>

          {!formFilled ? (
            <>
              <p className="ins-card-text">
                To begin, please provide your course and session details. This information helps
                observers conduct a thorough and constructive evaluation.
              </p>
              <button className="ins-btn" onClick={() => navigate('/instructor-intro')}>
                <JournalPlus size={18} />
                <span>Start Session Setup</span>
                <ArrowRightShort size={22} />
              </button>
            </>
          ) : (
            <div className="ins-success">
              <CheckCircleFill size={22} style={{ color: '#1a2535', flexShrink: 0 }} />
              <span>Thank you! Your course details have been successfully submitted.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsHome;
