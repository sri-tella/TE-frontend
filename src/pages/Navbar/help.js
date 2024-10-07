import React from 'react';
import Header from '../../components/Header/header';
import './home.css';

const Help = () => {
  return (
  <>
    <Header />
      <div className="home-container">
        <div className="help-container">
          <h1 className="home-heading">Help & Instructions</h1>
          <div className="instructions">
            <h2>How to Start an Observation</h2>
            <ol>
              <li>Log in to the application using your credentials.</li>
              <li>Navigate to the <strong>Start Observation</strong> page from the main menu.</li>
              <li>Select the course and fill out the required fields in the form.</li>
              <li>Click on <strong>Save</strong> to submit your Observation.</li>
            </ol>

            <h2>Steps to Complete an Observation</h2>
            <ol>
              <li>After starting an Observation, you'll be directed to the Observation form.</li>
              <li>Complete each section of the form by selecting the relevant options and providing feedback.</li>
              <li>Review your selections and feedback before finalizing.</li>
              <li>Click <strong>Save and Continue</strong> to save your progress.</li>
              <li>Once you have completed all sections, you can generate and download the final report.</li>
            </ol>
          </div>
        </div>
      </div>
      </>
    );
  };

export default Help;
