import React from 'react';
import Header from '../../components/Header/header';
import './help.css';
import { Eye, PersonVideo3, ShieldLock, Envelope, ArrowRightCircle, Check2Circle } from 'react-bootstrap-icons';

const Help = () => {
  const role = localStorage.getItem('role') || '';
  const roles = role.split(',').map(r => r.trim());

  const isObserver = roles.includes('OBSERVER');
  const isInstructor = roles.includes('INSTRUCTOR');
  const isAdmin = roles.includes('ADMIN');

  return (
    <>
      <Header />
      <div className="help-page-container">
        <div className="help-main-card">
          
          <header className="help-header">
            <h1 className="help-heading">Platform Guidance</h1>
            <p className="help-subtext">Comprehensive workflow instructions for your institutional role</p>
          </header>

          <div className="help-sections-wrapper">
            {isObserver && (
              <div className="help-compact-section">
                <h3><Eye /> Observer Workflow</h3>
                <div className="help-steps-grid">
                  <div className="step-item"><span>1</span> Navigate to <strong>Start Observation</strong> dashboard</div>
                  <div className="step-item"><span>2</span> Identify target <strong>Instructor & Class</strong> credentials</div>
                  <div className="step-item"><span>3</span> Document insights via <strong>Pedagogical Framework</strong></div>
                  <div className="step-item"><span>4</span> Execute <strong>Data Validation</strong> & Save progress</div>
                  <div className="step-item"><span>5</span> Generate <strong>Professional AI-Enhanced Report</strong></div>
                </div>
              </div>
            )}

            {isInstructor && (
              <div className="help-compact-section">
                <h3><PersonVideo3 /> Instructor Workflow</h3>
                <div className="help-steps-grid">
                  <div className="step-item"><span>1</span> Initialize your <strong>Course Credentials</strong> form</div>
                  <div className="step-item"><span>2</span> Define <strong>Strategic Learning Objectives</strong></div>
                  <div className="step-item"><span>3</span> Finalize session for <strong>Observer Discovery</strong></div>
                  <div className="step-item"><span>4</span> Request <strong>Dual-Role Privileges</strong> if needed</div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="help-compact-section">
                <h3><ShieldLock /> Admin Orchestration</h3>
                <div className="help-steps-grid">
                  <div className="step-item"><span>1</span> Manage <strong>User Identities</strong> & access levels</div>
                  <div className="step-item"><span>2</span> Authorize <strong>Cross-Role Access</strong> requests</div>
                  <div className="step-item"><span>3</span> Monitor <strong>System-Wide Integrity</strong> & Audits</div>
                </div>
              </div>
            )}
          </div>

          <footer className="help-footer-simple">
            <div className="contact-info">
              <Envelope style={{color: '#FFB81C'}} /> 
              <span>Institutional Support: <strong>teachingevaluation@gmail.com</strong></span>
            </div>
            <a href="mailto:teachingevaluation@gmail.com" className="btn-contact-simple">
              Get Assistance <ArrowRightCircle />
            </a>
          </footer>

        </div>
      </div>
    </>
  );
};

export default Help;