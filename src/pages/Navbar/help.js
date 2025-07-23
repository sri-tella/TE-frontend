import React from 'react';
import Header from '../../components/Header/header';
import './help.css';

const Help = () => {
  const role = localStorage.getItem('role');
  const roles = role ? role.split(',').map(r => r.trim()) : [];

  const showObserver = roles.includes('OBSERVER');
  const showInstructor = roles.includes('INSTRUCTOR');
  const showAdmin = roles.includes('ADMIN');

  return (
    <>
      <Header />
      <div className="help-wrapper">
        <div className="help-content">
          <h1>Help & Instructions</h1>

          {showObserver && (
            <div className="help-section">
              <h2>Steps for Observers</h2>
              <ol>
                <li>Log in and navigate to the <strong>Start Observation</strong> page.</li>
                <li>Select the instructor and class you want to observe.</li>
                <li>Fill in the observation form during or after the session.</li>
                <li>Save and review your observations.</li>
                <li>Generate and download the final observation report.</li>
              </ol>
            </div>
          )}

          {showInstructor && (
            <div className="help-section">
              <h2>Steps for Instructors</h2>
              <ol>
                <li>Log in and navigate to the <strong>Course Form</strong> page.</li>
                <li>Fill out your course/session details.</li>
                <li>Submit your form to make it available for observers.</li>
                <li>If needed, request <strong>Observer Access</strong> via the Profile page (Admins will approve).</li>
              </ol>
            </div>
          )}

          {showAdmin && (
            <div className="help-section">
              <h2>Steps for Admins</h2>
              <ol>
                <li>Log in and navigate to the <strong>Account Management</strong> tab.</li>
                <li>Add new admins or remove existing ones.</li>
                <li>Review and approve instructor role requests for dual access.</li>
              </ol>
            </div>
          )}

          <div className="help-section">
            <h2>Need More Help?</h2>
            <p>If you face issues, please contact support at <a href="mailto:teachingevaluation@gmail.com?subject=Support Request">teachingevaluation@gmail.com</a>.</p>
          </div>

          {!showObserver && !showInstructor && !showAdmin && (
            <div className="help-section">
              <h2>General Instructions</h2>
              <p>If you don’t see any role-specific instructions, please contact the administrator <a href="mailto:teachingevaluation@gmail.com?subject=Support Request">teachingevaluation@gmail.com</a>.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Help;
