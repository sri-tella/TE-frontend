import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/apiClient';
import { PersonBadge, Book, CalendarDate, Clock, JournalText, CheckCircle, EnvelopeFill, Send } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import './InstructorIntro.css';

const InstructorIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [observerEmail, setObserverEmail] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        instructorFirstName: user.firstName || '',
        instructorLastName: user.lastName || '',
        instructorEmail: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: false }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await apiClient('/api/form/instructor', { body: formData });
      localStorage.setItem(`instructorFormSubmitted_${user?.id}`, 'true');
      setSubmitted(true);
    } catch (_) {
      alert("Failed to save instructor info. Please try again.");
    }
  };

  const handleNotifyObserver = async () => {
    if (!observerEmail.trim()) return toast.warning('Please enter the observer\'s email.');
    setNotifySending(true);
    try {
      await apiClient('/api/form/instructor/notify-observer', {
        body: {
          observerEmail: observerEmail.trim(),
          instructorName: `${formData.instructorFirstName} ${formData.instructorLastName}`.trim(),
        },
      });
      setNotifySent(true);
      toast.success('Observer notified successfully!');
    } catch {
      toast.error('Could not send notification. Please try again.');
    } finally {
      setNotifySending(false);
    }
  };

  if (submitted) {
    return (
      <div id="intro-form-scoped">
        <div className="container py-5">
          <div className="intro-hero text-center mb-5">
            <CheckCircle className="intro-success-icon mb-3" />
            <h1 className="intro-main-title">Session Details Saved</h1>
            <p className="intro-sub-title">Your pre-observation questionnaire has been submitted successfully.</p>
          </div>

          <div className="intro-card mb-4 shadow-sm border-0" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="intro-card-header d-flex align-items-center mb-4">
              <EnvelopeFill className="header-icon me-3" />
              <h2 className="mb-0">Notify Your Observer</h2>
            </div>
            <p className="intro-notify-desc">
              Let your observer know the questionnaire is ready. Enter their email below to send a notification.
            </p>

            {notifySent ? (
              <div className="intro-notify-sent">
                <CheckCircle size={18} className="me-2" />
                Notification sent to <strong>{observerEmail}</strong>
              </div>
            ) : (
              <div className="intro-notify-form">
                <label className="intro-label">Observer's email</label>
                <div className="intro-notify-row">
                  <input
                    type="email"
                    className="form-control-v3"
                    placeholder="observer@atl.edu"
                    value={observerEmail}
                    onChange={e => setObserverEmail(e.target.value)}
                    disabled={notifySending}
                  />
                  <button
                    className="btn-atl-notify"
                    onClick={handleNotifyObserver}
                    disabled={notifySending}
                  >
                    {notifySending
                      ? <span className="intro-spinner" />
                      : <><Send size={14} className="me-2" />Send</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-4">
            <button
              className="btn-atl-secondary"
              onClick={() => navigate('/ins-home')}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
              <PersonBadge className="header-icon me-3" />
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
              <Book className="header-icon me-3" />
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
                <label className="intro-label"><CalendarDate className="me-2" /> Class Date</label>
                <input
                  type="date"
                  name="date"
                  className={`form-control-v3 ${formErrors.date ? 'is-invalid-v3' : ''}`}
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="intro-label"><Clock className="me-2" /> Class Time</label>
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
              <JournalText className="header-icon me-3" />
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
            <button type="submit" className="btn-atl-submit">
              <CheckCircle className="me-3" /> Submit Session Details
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InstructorIntro;
