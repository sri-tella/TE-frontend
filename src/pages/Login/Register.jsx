import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { toast } from 'react-toastify';
import { Eye, EyeSlash, CheckCircleFill, EyeFill, MortarboardFill, ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import logo from '../../assets/logo.png';
import './Register.css';

const ROLES = [
  {
    value: 'OBSERVER',
    icon: <EyeFill size={22} />,
    label: 'Observer',
    desc: 'Conduct classroom evaluations',
  },
  {
    value: 'INSTRUCTOR',
    icon: <MortarboardFill size={22} />,
    label: 'Instructor',
    desc: 'View your evaluation reports',
  },
];

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '',
    email: '', confirmEmail: '',
    password: '', confirmPassword: '',
    role: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: (userData) => authApi.signup(userData),
    onSuccess: () => {
      toast.success('Account created! Please sign in.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Signup failed. Please try again.');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email !== formData.confirmEmail) return toast.error('Emails do not match');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (!formData.role) return toast.error('Please select a role');
    signupMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      roles: [formData.role],
    });
  };

  return (
    <div id="auth-page-scoped">
      <div className="auth-split">

        {/* LEFT PANEL */}
        <div className={`auth-left${leftOpen ? '' : ' auth-left--collapsed'}`}>
          <div className="auth-left-inner">
            <img src={logo} alt="Baylor University" className="auth-left-logo" />
            <h1 className="auth-left-title">Join the Platform</h1>
            <p className="auth-left-sub">Create your account and start using the Teaching Evaluation system today</p>
            <ul className="auth-feature-list">
              <li><CheckCircleFill size={14} className="auth-feature-icon" /> Free to use for Baylor staff</li>
              <li><CheckCircleFill size={14} className="auth-feature-icon" /> Secure role-based access</li>
              <li><CheckCircleFill size={14} className="auth-feature-icon" /> Ready in under a minute</li>
            </ul>
          </div>
          <div className="auth-deco-circle auth-deco-1" />
          <div className="auth-deco-circle auth-deco-2" />
          <div className="auth-deco-circle auth-deco-3" />
        </div>

        {/* TOGGLE — вне панели, всегда виден */}
        <button
          className={`auth-panel-toggle${leftOpen ? '' : ' auth-panel-toggle--closed'}`}
          onClick={() => setLeftOpen(v => !v)}
          title={leftOpen ? 'Hide panel' : 'Show panel'}
        >
          {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-form-box auth-form-box--wide">
            <div className="auth-form-header">
              <h2 className="auth-heading">Create account</h2>
              <p className="auth-subtext">Fill in your details below to get started</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>

              {/* Name row */}
              <div className="auth-row">
                <div className="auth-field">
                  <label>First name</label>
                  <input type="text" name="firstName" placeholder="John" className="auth-input"
                    value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="auth-field">
                  <label>Last name</label>
                  <input type="text" name="lastName" placeholder="Doe" className="auth-input"
                    value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>

              {/* Email row */}
              <div className="auth-row">
                <div className="auth-field">
                  <label>Email address</label>
                  <input type="email" name="email" placeholder="you@baylor.edu" className="auth-input"
                    value={formData.email} onChange={handleChange} required />
                </div>
                <div className="auth-field">
                  <label>Confirm email</label>
                  <input type="email" name="confirmEmail" placeholder="Confirm email" className="auth-input"
                    value={formData.confirmEmail} onChange={handleChange} required />
                </div>
              </div>

              {/* Password row */}
              <div className="auth-row">
                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-input-wrap">
                    <input type={showPass ? 'text' : 'password'} name="password"
                      placeholder="••••••••" className="auth-input"
                      value={formData.password} onChange={handleChange} required />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                      {showPass ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Confirm password</label>
                  <div className="auth-input-wrap">
                    <input type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                      placeholder="••••••••" className="auth-input"
                      value={formData.confirmPassword} onChange={handleChange} required />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                      {showConfirm ? <EyeSlash size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role cards */}
              <div className="auth-field">
                <label>Select your role</label>
                <div className="auth-role-cards">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      className={`auth-role-card${formData.role === r.value ? ' selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, role: r.value }))}
                    >
                      <div className="auth-role-icon">{r.icon}</div>
                      <span className="auth-role-label">{r.label}</span>
                      <span className="auth-role-desc">{r.desc}</span>
                      {formData.role === r.value && (
                        <CheckCircleFill size={14} className="auth-role-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? <span className="auth-spinner" /> : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
