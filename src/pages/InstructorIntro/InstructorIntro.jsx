import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/apiClient';
import { PersonBadge, Book, CalendarDate, Clock, JournalText, CheckCircle, EnvelopeFill, Search, ChevronDown } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import './InstructorIntro.css';

const ObserverSelect = ({ observers, value, onChange, hasError }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef(null);

  const sortedObservers = useMemo(() =>
    [...observers].sort((a, b) =>
      `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`)
    ), [observers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedObservers;
    return sortedObservers.filter(o => `${o.firstname} ${o.lastname}`.toLowerCase().includes(q));
  }, [sortedObservers, search]);

  const selected = observers.find(o => o.observer_id === value);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="intro-observer-select" ref={wrapRef}>
      <button
        type="button"
        className={`form-control-v3 intro-observer-trigger ${hasError ? 'is-invalid-v3' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected ? `${selected.firstname} ${selected.lastname}` : 'Select an observer…'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="intro-observer-dropdown">
          <div className="intro-observer-search">
            <Search size={14} />
            <input
              autoFocus
              type="text"
              placeholder="Search observers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="intro-observer-options">
            {filtered.length === 0 && <div className="intro-observer-empty">No observers found</div>}
            {filtered.map(o => (
              <button
                type="button"
                key={o.observer_id}
                className={`intro-observer-option ${value === o.observer_id ? 'intro-observer-option--selected' : ''}`}
                onClick={() => { onChange(o.observer_id); setOpen(false); setSearch(''); }}
              >
                {o.firstname} {o.lastname}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InstructorIntro = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    instructorFirstName: '',
    instructorLastName: '',
    instructorEmail: '',
    observerId: null,
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
  const [observers, setObservers] = useState([]);
  const [selectedObserverName, setSelectedObserverName] = useState('');
  const [emailWarning, setEmailWarning] = useState('');

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

  useEffect(() => {
    apiClient('/api/observers').then(setObservers).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleObserverChange = (observerId) => {
    setFormData(prev => ({ ...prev, observerId }));
    setFormErrors(prev => ({ ...prev, observerId: false }));
  };

  const validateForm = () => {
    const requiredFields = ['courseTitle', 'courseDescription', 'topic', 'date', 'time', 'goal', 'outline', 'help'];
    const errors = {};
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') errors[field] = true;
    });
    if (!formData.observerId) errors.observerId = true;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.warning('Please select an observer and fill in all fields.');

    try {
      const observer = observers.find(o => o.observer_id === formData.observerId);
      setSelectedObserverName(observer ? `${observer.firstname} ${observer.lastname}` : '');
      const response = await apiClient('/api/form/instructor', { body: formData });
      setEmailWarning(response?.emailWarning || '');
      localStorage.setItem(`instructorFormSubmitted_${user?.userId}`, 'true');
      setSubmitted(true);
    } catch (_) {
      alert("Failed to save instructor info. Please try again.");
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
              <h2 className="mb-0">Observer Notified</h2>
            </div>
            {emailWarning ? (
              <div className="intro-notify-sent" style={{ background: 'rgba(220,53,69,0.12)', color: '#dc3545' }}>
                {emailWarning}
              </div>
            ) : (
              <div className="intro-notify-sent">
                <CheckCircle size={18} className="me-2" />
                {selectedObserverName || 'Your observer'} has been emailed that this session is ready.
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
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="intro-label">Observer</label>
                <ObserverSelect
                  observers={observers}
                  value={formData.observerId}
                  onChange={handleObserverChange}
                  hasError={formErrors.observerId}
                />
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
