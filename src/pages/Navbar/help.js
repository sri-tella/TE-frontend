import React from 'react';
import Header from '../../components/Header/header';
import './help.css';
import { Eye, PersonVideo3, ShieldLock, Envelope } from 'react-bootstrap-icons';

const Help = () => {
  const role = localStorage.getItem('role');
  const roles = role ? role.split(',').map(r => r.trim()) : [];

  const showObserver = roles.includes('OBSERVER');
  const showInstructor = roles.includes('INSTRUCTOR');
  const showAdmin = roles.includes('ADMIN');

  return (
    <>
      <Header />
      <div className="help-page-container">
        <div className="help-card">
          <h1 className="help-heading">Help & Instructions</h1>
          <p className="help-subtext">Follow the steps below based on your role.</p>

          <div className="help-body">
            {showObserver && (
              <div className="help-section">
                <h2><Eye className="section-icon" /> Steps for Observers</h2>
                <ol>
                  <li>Log in and navigate to the <strong>Start Observation</strong> page.</li>
                  <li>Select the instructor and class you want to observe from the list.</li>
                  <li>Fill in the observation form during or after the session.</li>
                  <li>Save and review your observations carefully.</li>
                  <li>Generate and download the final observation report.</li>
                </ol>
              </div>
            )}

            {showInstructor && (
              <div className="help-section">
                <h2><PersonVideo3 className="section-icon" /> Steps for Instructors</h2>
                <ol>
                  <li>Log in and navigate to the <strong>Course Form</strong> page.</li>
                  <li>Fill out your course/session details accurately.</li>
                  <li>Submit your form to make it available for observers in the system.</li>
                  <li>If needed, request <strong>Observer Access</strong> via the Profile page.</li>
                </ol>
              </div>
            )}

            {showAdmin && (
              <div className="help-section">
                <h2><ShieldLock className="section-icon" /> Steps for Admins</h2>
                <ol>
                  <li>Log in and navigate to the <strong>Account Management</strong> tab.</li>
                  <li>Add new admins or remove existing users as needed.</li>
                  <li>Review and approve instructor role requests for dual access.</li>
                </ol>
              </div>
            )}

            {!showObserver && !showInstructor && !showAdmin && (
              <div className="help-section">
                <h2>General Instructions</h2>
                <p>No specific role detected. Please contact the administrator.</p>
              </div>
            )}

            <div className="contact-section">
              <h3><Envelope className="section-icon" /> Need More Help?</h3>
              <p>
                If you face issues, please contact support at: <br />
                <a href="mailto:teachingevaluation@gmail.com?subject=Support Request" className="contact-link">
                  teachingevaluation@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;