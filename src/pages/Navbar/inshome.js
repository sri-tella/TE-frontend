import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import './mainform.css'; 

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
      <div className="main-form-page">
        <div className="main-form-card" style={{ maxWidth: '600px', textAlign: 'center' }}>
          
          <div className="form-instructions">
            <h4 style={{ marginBottom: '20px' }}>
              Welcome to Teaching Observation Application
            </h4>
            
            {!formFilled ? (
              <>
                <p style={{ marginBottom: '30px' }}>
                  Please complete your course/session details.
                </p>
                <button 
                  className="btn-baylor-save" 
                  onClick={handleFillForm}
                  style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'block' }}
                >
                  Fill in Form
                </button>
              </>
            ) : (
              <div className="observation-subtitle" style={{ textAlign: 'center', marginTop: '20px' }}>
                Thank you for submitting your form!
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default InsHome;