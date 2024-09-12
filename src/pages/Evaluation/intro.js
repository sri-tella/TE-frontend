import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './intro.css';
import Header from '../../components/Header/header';
import axios from 'axios';

const CombinedForm = ({ nextStep }) => {
  const [formData, setFormData] = useState({
    observerFirstName: '',
    observerLastName: '',
    observerEmail: '',
    instructorFirstName: '',
    instructorLastName: '',
    courseTitle: '',
    courseDescription: '',
  });

  const [formErrors, setFormErrors] = useState({
    observerFirstName: false,
    observerLastName: false,
    observerEmail: false,
    instructorFirstName: false,
    instructorLastName: false,
    courseTitle: false,
    courseDescription: false,
    topic: false,
    date: false,
    time: false,
    goal: false,
    outline: false,
    help: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setFormErrors({
      ...formErrors,
      [name]: false  // Resetting error state when input changes
    });
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
        const formDataToSend = {
            observerFirstName: formData.observerFirstName,
            observerLastName: formData.observerLastName,
            observerEmail: formData.observerEmail,
            instructorFirstName: formData.instructorFirstName,
            instructorLastName: formData.instructorLastName,
            courseTitle: formData.courseTitle,
            courseDescription: formData.courseDescription
        };
      console.log(formDataToSend);
      await axios.post('https://te-backend-production.up.railway.app/api/form', formData);
      nextStep(formData);
      navigate('/Evaluate');
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      observerFirstName: false,
      observerLastName: false,
      observerEmail: false,
      instructorFirstName: false,
      instructorLastName: false,
      courseTitle: false,
      courseDescription: false,
      topic: false,
      date: false,
      time: false,
      goal: false,
      outline: false,
      help: false
    };

    // Basic validation, you can add more specific validations as needed
    if (formData.observerFirstName.trim() === '') {
      errors.observerFirstName = true;
      isValid = false;
    }
    if (formData.observerLastName.trim() === '') {
      errors.observerLastName = true;
      isValid = false;
    }
    if (formData.observerEmail.trim() === '' || !isValidEmail(formData.observerEmail)) {
      errors.observerEmail = true;
      isValid = false;
    }
    if (formData.instructorFirstName.trim() === '') {
      errors.instructorFirstName = true;
      isValid = false;
    }
    if (formData.instructorLastName.trim() === '') {
      errors.instructorLastName = true;
      isValid = false;
    }
    if (formData.courseTitle.trim() === '') {
      errors.courseTitle = true;
      isValid = false;
    }
    if (formData.courseDescription.trim() === '') {
      errors.courseDescription = true;
      isValid = false;
    }
    if (formData.topic.trim() === '') {
      errors.topic = true;
      isValid = false;
    }
    if (formData.date.trim() === '') {
      errors.date = true;
      isValid = false;
    }
    if (formData.time.trim() === '') {
      errors.time = true;
      isValid = false;
    }
    if (formData.goal.trim() === '') {
      errors.goal = true;
      isValid = false;
    }
    if (formData.outline.trim() === '') {
      errors.outline = true;
      isValid = false;
    }
    if (formData.help.trim() === '') {
      errors.help = true;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const isValidEmail = (email) => {
    // Basic email validation regex, adjust as per your requirements
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <>
      <Header />
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Observer Information</h2>
          <div className={`form-group ${formErrors.observerFirstName ? 'has-error' : ''}`}>
            <label>First Name:</label>
            <input
              type="text"
              name="observerFirstName"
              value={formData.observerFirstName}
              onChange={handleChange}
              required
            />
            {formErrors.observerFirstName && <span className="error-message">First Name is required</span>}
          </div>
          <div className={`form-group ${formErrors.observerLastName ? 'has-error' : ''}`}>
            <label>Last Name:</label>
            <input
              type="text"
              name="observerLastName"
              value={formData.observerLastName}
              onChange={handleChange}
              required
            />
            {formErrors.observerLastName && <span className="error-message">Last Name is required</span>}
          </div>
          <div className={`form-group ${formErrors.observerEmail ? 'has-error' : ''}`}>
            <label>Email:</label>
            <input
              type="email"
              name="observerEmail"
              value={formData.observerEmail}
              onChange={handleChange}
              required
            />
            {formErrors.observerEmail && <span className="error-message">Valid Email is required</span>}
          </div>
        </div>

        <div className="form-section">
          <h2>Instructor Information</h2>
          <div className={`form-group ${formErrors.instructorFirstName ? 'has-error' : ''}`}>
            <label>First Name:</label>
            <input
              type="text"
              name="instructorFirstName"
              value={formData.instructorFirstName}
              onChange={handleChange}
              required
            />
            {formErrors.instructorFirstName && <span className="error-message">First Name is required</span>}
          </div>
          <div className={`form-group ${formErrors.instructorLastName ? 'has-error' : ''}`}>
            <label>Last Name:</label>
            <input
              type="text"
              name="instructorLastName"
              value={formData.instructorLastName}
              onChange={handleChange}
              required
            />
            {formErrors.instructorLastName && <span className="error-message">Last Name is required</span>}
          </div>
          <div className={`form-group ${formErrors.courseTitle ? 'has-error' : ''}`}>
            <label>Course Title:</label>
            <input
              type="text"
              name="courseTitle"
              value={formData.courseTitle}
              onChange={handleChange}
              required
            />
            {formErrors.courseTitle && <span className="error-message">Course Title is required</span>}
          </div>
          <div className={`form-group ${formErrors.courseDescription ? 'has-error' : ''}`}>
            <label>Course Number:</label>
            <input
              type="text"
              name="courseDescription"
              value={formData.courseDescription}
              onChange={handleChange}
              required
            />
            {formErrors.courseDescription && <span className="error-message">Course Description is required</span>}
          </div>
          <div className={`form-group ${formErrors.topic ? 'has-error' : ''}`}>
            <label>Class Session Topic:</label>
            <input
              type="text"
              name="topic"
              onChange={handleChange}
              required
            />
            {formErrors.topic && <span className="error-message">Class Session Topic is required</span>}
          </div>
          <div className={`form-group ${formErrors.date ? 'has-error' : ''}`}>
            <label>Class Date:</label>
            <input
              type="date"
              name="date"
              onChange={handleChange}
              required
            />
            {formErrors.date && <span className="error-message">Class Date is required</span>}
          </div>
          <div className={`form-group ${formErrors.time ? 'has-error' : ''}`}>
            <label>Class Time:</label>
            <input
              type="time"
              name="time"
              onChange={handleChange}
              required
            />
            {formErrors.time && <span className="error-message">Class Time is required</span>}
          </div>
        </div>

        <div className="form-section">
          <h2>Course Background Information</h2>
          <div className={`form-group ${formErrors.goal ? 'has-error' : ''}`}>
            <label>1. What are the learning objectives for today's session?</label>
            <textarea
              type="text"
              name="goal"
              onChange={handleChange}
              required
            />
            {formErrors.goal && <span className="error-message">Learning Objectives are required</span>}
          </div>
          <div className={`form-group ${formErrors.outline ? 'has-error' : ''}`}>
            <label>2. Please provide a brief outline or sketch of how the class session will proceed; for example, "mini-lecture; small group activity; mini-lecture; quiz; review."</label>
            <textarea
              type="text"
              name="outline"
              onChange={handleChange}
              required
            />
            {formErrors.outline && <span className="error-message">Outline is required</span>}
          </div>
          <div className={`form-group ${formErrors.help ? 'has-error' : ''}`}>
          <label>3. How might the observer be particularly helpful in the observation process?</label>
            <textarea
              type="text"
              name="help"
              onChange={handleChange}
              required
            />
          {formErrors.outline && <span className="error-message"> This field is required</span>}
          </div>
       </div>
       <div>
     <button type="submit" class= "introsubmit">Continue to Form</button>
     </div>
   </form>
 </>
 );
};

export default CombinedForm;
