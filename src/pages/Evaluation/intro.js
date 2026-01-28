import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './intro.css';
import './mainform.css';
import Header from '../../components/Header/header';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';

const CombinedForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    instructorFirstName: '',
    instructorLastName: '',
    instructorEmail: '',
    courseTitle: '',
    courseDescription: '',
    topic: '',
    date: '',
    time: '',
    goal: '',
    outline: '',
    help: ''
  });

  const [formErrors, setFormErrors] = useState({})

  // auto populating the instructor information from local storage
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      instructorFirstName: localStorage.getItem('firstName') || '',
      instructorLastName: localStorage.getItem('lastName') || '',
      instructorEmail: localStorage.getItem('email') || ''
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: false
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate form before submission
    console.log("starting validation")
    if (!validateForm()) {
      return;
    }
    console.log("Submitting formData:", formData);

    try {
      console.log(formData);
      await axios.post(`${API_BASE_URL}/api/form/instructor`, formData);
      // alert("Instructor information saved successfully!");
      localStorage.setItem('instructorFormSubmitted', 'true');
      navigate('/inshome');
    } catch (error) {
      console.error("Error saving instructor info:", error);
      alert("Failed to save instructor info.");
    }
  };


  const validateForm = () => {
    const requiredFields = ['courseTitle', 'courseDescription', 'topic', 'date', 'time', 'goal', 'outline', 'help'];
    const errors = {};

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = true;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <>
      <Header />
      <div className="main-form-page">
        <div className="main-form-card">
          
          <div className="form-header-row">
            <div className="form-instructions">
              <h4>Instructor Information</h4>
              <p>Please fill in all the details below before submitting the form.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2 style={{ fontSize: '1.5rem', color: '#154734', borderBottomColor: '#154734' }}>Personal Details</h2>
              <div className="form-row">
                <div className="form-group third-width">
                  <label>First Name:</label>
                  <input type="text" value={formData.instructorFirstName} disabled style={{ backgroundColor: '#f0f2f5' }} />
                </div>
                <div className="form-group third-width">
                  <label>Last Name:</label>
                  <input type="text" value={formData.instructorLastName} disabled style={{ backgroundColor: '#f0f2f5' }} />
                </div>
                <div className="form-group third-width">
                  <label>Email:</label>
                  <input type="email" value={formData.instructorEmail} disabled style={{ backgroundColor: '#f0f2f5' }} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 style={{ fontSize: '1.5rem', color: '#154734', borderBottomColor: '#154734' }}>Course Details</h2>
              <div className="form-row">
                <div className={`form-group third-width ${formErrors.courseTitle ? 'has-error' : ''}`}>
                  <label>Course Title:</label>
                  <input name="courseTitle" value={formData.courseTitle} onChange={handleChange} />
                  {formErrors.courseTitle && (
                    <span className="error-message">This field is required</span>
                  )}
                </div>
                <div className={`form-group third-width ${formErrors.courseDescription ? 'has-error' : ''}`}>
                  <label>Course Number:</label>
                  <input name="courseDescription" value={formData.courseDescription} onChange={handleChange} />
                  {formErrors.courseDescription && (
                    <span className="error-message">This field is required</span>
                  )}
                </div>
                <div className={`form-group third-width ${formErrors.topic ? 'has-error' : ''}`}>
                  <label>Class Session Topic:</label>
                  <input name="topic" value={formData.topic} onChange={handleChange} />
                  {formErrors.topic && (
                    <span className="error-message">This field is required</span>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className={`form-group half-width ${formErrors.date ? 'has-error' : ''}`}>
                  <label>Class Date:</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} />
                  {formErrors.date && (
                    <span className="error-message">This field is required</span>
                  )}
                </div>
                <div className={`form-group half-width ${formErrors.time ? 'has-error' : ''}`}>
                  <label>Class Time:</label>
                  <input type="time" name="time" value={formData.time} onChange={handleChange} />
                  {formErrors.time && (
                    <span className="error-message">This field is required</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section" style={{ borderBottom: 'none' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#154734', borderBottomColor: '#154734' }}>Course Background Information</h2>
              <div className={`form-group ${formErrors.goal ? 'has-error' : ''}`}>
                <label>1. What are the learning objectives for today's session?</label>
                <textarea name="goal" value={formData.goal} onChange={handleChange} />
                {formErrors.goal && (
                  <span className="error-message">This field is required</span>
                )}
              </div>
              <div className={`form-group ${formErrors.outline ? 'has-error' : ''}`}>
                <label>2. Provide a brief outline of how the session will proceed (mini-lecture, small group, etc.):</label>
                <textarea name="outline" value={formData.outline} onChange={handleChange} />
                {formErrors.outline && (
                  <span className="error-message">This field is required</span>
                )}
              </div>
              <div className={`form-group ${formErrors.help ? 'has-error' : ''}`}>
                <label>3. How might the observer be helpful in the evaluation process?</label>
                <textarea name="help" value={formData.help} onChange={handleChange} />
                {formErrors.help && (
                  <span className="error-message">This field is required</span>
                )}
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" className="btn-baylor-save">
                Submit Information
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );

};

export default CombinedForm;