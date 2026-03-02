import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './intro.css';
import Header from '../../components/Header/header';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { PersonBadge, Book, CalendarDate, Clock, JournalText, CheckCircle } from 'react-bootstrap-icons';

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
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await axios.post(`${API_BASE_URL}/api/form/instructor`, formData);
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
      if (!formData[field] || formData[field].trim() === '') errors[field] = true;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <>
      <Header />
      <div id="intro-form-scoped">
        <div className="container py-5">
          
          <div className="intro-hero text-center mb-5">
            <h1 className="intro-main-title">Session Setup</h1>
            <p className="intro-sub-title">Provide details for your upcoming observation</p>
          </div>

          <form onSubmit={handleSubmit} className="intro-main-form">
            
            {/* Section 1: Personal */}
            <div className="intro-card mb-4 shadow-sm border-0">
              <div className="intro-card-header d-flex align-items-center mb-4">
                <PersonBadge className="header-icon mr-3" />
                <h2 className="mb-0">Instructor Profile</h2>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="intro-label">First Name</label>
                  <input type="text" className="form-control-v3 read-only" value={formData.instructorFirstName} readOnly />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="intro-label">Last Name</label>
                  <input type="text" className="form-control-v3 read-only" value={formData.instructorLastName} readOnly />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="intro-label">Email</label>
                  <input type="email" className="form-control-v3 read-only" value={formData.instructorEmail} readOnly />
                </div>
              </div>
            </div>

            {/* Section 2: Course */}
            <div className="intro-card mb-4 shadow-sm border-0">
              <div className="intro-card-header d-flex align-items-center mb-4">
                <Book className="header-icon mr-3" />
                <h2 className="mb-0">Course Information</h2>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="intro-label">Course Title</label>
                  <input 
                    name="courseTitle" 
                    className={`form-control-v3 ${formErrors.courseTitle ? 'is-invalid-v3' : ''}`}
                    value={formData.courseTitle} 
                    onChange={handleChange} 
                    placeholder="e.g. Introduction to Psychology"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="intro-label">Course Number</label>
                  <input 
                    name="courseDescription" 
                    className={`form-control-v3 ${formErrors.courseDescription ? 'is-invalid-v3' : ''}`}
                    value={formData.courseDescription} 
                    onChange={handleChange} 
                    placeholder="e.g. PSY 1305"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="intro-label">Session Topic</label>
                  <input 
                    name="topic" 
                    className={`form-control-v3 ${formErrors.topic ? 'is-invalid-v3' : ''}`}
                    value={formData.topic} 
                    onChange={handleChange} 
                    placeholder="e.g. Cognitive Development"
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6 mb-3">
                  <label className="intro-label"><CalendarDate className="mr-2" /> Class Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    className={`form-control-v3 ${formErrors.date ? 'is-invalid-v3' : ''}`}
                    value={formData.date} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="intro-label"><Clock className="mr-2" /> Class Time</label>
                  <input 
                    type="time" 
                    name="time" 
                    className={`form-control-v3 ${formErrors.time ? 'is-invalid-v3' : ''}`}
                    value={formData.time} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Background */}
            <div className="intro-card mb-5 shadow-sm border-0">
              <div className="intro-card-header d-flex align-items-center mb-4">
                <JournalText className="header-icon mr-3" />
                <h2 className="mb-0">Session Context</h2>
              </div>
              
              <div className="mb-4">
                <label className="intro-label">1. What are the learning objectives for today's session?</label>
                <textarea 
                  name="goal" 
                  className={`form-control-v3 textarea-v3 ${formErrors.goal ? 'is-invalid-v3' : ''}`}
                  value={formData.goal} 
                  onChange={handleChange} 
                  placeholder="Describe what students should achieve..."
                />
              </div>

              <div className="mb-4">
                <label className="intro-label">2. Provide a brief outline of how the session will proceed:</label>
                <textarea 
                  name="outline" 
                  className={`form-control-v3 textarea-v3 ${formErrors.outline ? 'is-invalid-v3' : ''}`}
                  value={formData.outline} 
                  onChange={handleChange} 
                  placeholder="Mini-lecture, small group discussion, etc..."
                />
              </div>

              <div className="mb-2">
                <label className="intro-label">3. How might the observer be helpful in the evaluation process?</label>
                <textarea 
                  name="help" 
                  className={`form-control-v3 textarea-v3 ${formErrors.help ? 'is-invalid-v3' : ''}`}
                  value={formData.help} 
                  onChange={handleChange} 
                  placeholder="Are there specific areas you want feedback on?"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="intro-footer-sticky">
              <button type="submit" className="btn-baylor-submit">
                <CheckCircle className="mr-3" /> Submit Session Details
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default CombinedForm;