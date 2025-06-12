import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './intro.css';
import Header from '../../components/Header/header';
import axios from 'axios';

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
          await axios.post('https://te-backend-production.up.railway.app/api/form/instructor', formData);
//          alert("Instructor information saved successfully!");
          localStorage.setItem('instructorFormSubmitted', 'true');
          navigate('/inshome');
        } catch (error) {
          console.error("Error saving instructor info:", error);
          alert("Failed to save instructor info.");
        }
      };


//    try {
//        const formDataToSend = {
//            observerFirstName: formData.observerFirstName,
//            observerLastName: formData.observerLastName,
//            observerEmail: formData.observerEmail,
//            instructorFirstName: formData.instructorFirstName,
//            instructorLastName: formData.instructorLastName,
//            courseTitle: formData.courseTitle,
//            courseDescription: formData.courseDescription
//        };
//      console.log(formDataToSend);
//      await axios.post('http://localhost:8080/api/form', formData);
//      nextStep(formData);
//      navigate('/Evaluate');
//    } catch (error) {
//      console.error('Error saving form data:', error);
//    }
//  };

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

//  return (
//    <>
//      <Header />
//      <form onSubmit={handleSubmit}>
//        <div className="form-section">
//          <h2>Instructor Information</h2>
//          <div className={`form-group ${formErrors.instructorFirstName ? 'has-error' : ''}`}>
//            <label>First Name:</label>
//            <input
//              type="text"
//              name="instructorFirstName"
//              value={formData.instructorFirstName}
//              onChange={handleChange}
//              required
//            />
//            {formErrors.instructorFirstName && <span className="error-message">First Name is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.instructorLastName ? 'has-error' : ''}`}>
//            <label>Last Name:</label>
//            <input
//              type="text"
//              name="instructorLastName"
//              value={formData.instructorLastName}
//              onChange={handleChange}
//              required
//            />
//            {formErrors.instructorLastName && <span className="error-message">Last Name is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.courseTitle ? 'has-error' : ''}`}>
//            <label>Course Title:</label>
//            <input
//              type="text"
//              name="courseTitle"
//              value={formData.courseTitle}
//              onChange={handleChange}
//              required
//            />
//            {formErrors.courseTitle && <span className="error-message">Course Title is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.courseDescription ? 'has-error' : ''}`}>
//            <label>Course Number:</label>
//            <input
//              type="text"
//              name="courseDescription"
//              value={formData.courseDescription}
//              onChange={handleChange}
//              required
//            />
//            {formErrors.courseDescription && <span className="error-message">Course Description is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.topic ? 'has-error' : ''}`}>
//            <label>Class Session Topic:</label>
//            <input
//              type="text"
//              name="topic"
//              onChange={handleChange}
//              required
//            />
//            {formErrors.topic && <span className="error-message">Class Session Topic is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.date ? 'has-error' : ''}`}>
//            <label>Class Date:</label>
//            <input
//              type="date"
//              name="date"
//              onChange={handleChange}
//              required
//            />
//            {formErrors.date && <span className="error-message">Class Date is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.time ? 'has-error' : ''}`}>
//            <label>Class Time:</label>
//            <input
//              type="time"
//              name="time"
//              onChange={handleChange}
//              required
//            />
//            {formErrors.time && <span className="error-message">Class Time is required</span>}
//          </div>
//        </div>
//
//        <div className="form-section">
//          <h2>Course Background Information</h2>
//          <div className={`form-group ${formErrors.goal ? 'has-error' : ''}`}>
//            <label>1. What are the learning objectives for today's session?</label>
//            <textarea
//              type="text"
//              name="goal"
//              onChange={handleChange}
//              required
//            />
//            {formErrors.goal && <span className="error-message">Learning Objectives are required</span>}
//          </div>
//          <div className={`form-group ${formErrors.outline ? 'has-error' : ''}`}>
//            <label>2. Please provide a brief outline or sketch of how the class session will proceed; for example, "mini-lecture; small group activity; mini-lecture; quiz; review."</label>
//            <textarea
//              type="text"
//              name="outline"
//              onChange={handleChange}
//              required
//            />
//            {formErrors.outline && <span className="error-message">Outline is required</span>}
//          </div>
//          <div className={`form-group ${formErrors.help ? 'has-error' : ''}`}>
//          <label>3. How might the observer be particularly helpful in the observation process?</label>
//            <textarea
//              type="text"
//              name="help"
//              onChange={handleChange}
//              required
//            />
//          {formErrors.outline && <span className="error-message"> This field is required</span>}
//          </div>
//       </div>
//       <div>
//     <button type="submit" class= "introsubmit">Continue to Form</button>
//     </div>
//   </form>
// </>
// );

return (
    <>
      <Header />
      <div className="form-instructions">
        <p>Please fill in all the details below before submitting the form.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Instructor Information</h2>
          <div className="form-group">
            <label>First Name:</label>
            <input type="text" value={formData.instructorFirstName} disabled />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input type="text" value={formData.instructorLastName} disabled />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={formData.instructorEmail} disabled />
          </div>
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

        <div className="form-section">
          <h2>Course Background Information</h2>
          <div className={`form-group ${formErrors.goal ? 'has-error' : ''}`}>
            <label>1. What are the learning objectives for today's session?</label>
            <textarea name="goal" value={formData.goal} onChange={handleChange} />
            {formErrors.goal && (
              <span className="error-message">This field is required</span>
            )}
          </div>
          <div className={`form-group ${formErrors.outline ? 'has-error' : ''}`}>
            <label>2. Provide a brief outline of how the session will proceed (for example, mini-lecture; small group activity; quiz; review):</label>
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

        <button type="submit" className="introsubmit">Submit</button>
      </form>
    </>
  );

};

export default CombinedForm;
