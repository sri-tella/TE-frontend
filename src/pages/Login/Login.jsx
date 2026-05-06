import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/authSchema';
import { useAuth } from '../../hooks/useAuth';
import { useRoles } from '../../hooks/useRoles';
import { Eye, EyeSlash, CheckCircleFill, ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import InlineEdit from '../../components/InlineEdit/InlineEdit';
import logo from "../../assets/logo.png";
import './Login.css';

const Login = () => {
  const { login, isLoading, error: loginError } = useAuth();
  const { canEdit, hasRole } = useRoles();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [leftOpen, setLeftOpen] = useState(() => {
    const saved = localStorage.getItem('auth-panel-open');
    return saved === null ? true : saved === 'true';
  });

  const togglePanel = () => setLeftOpen(v => {
    const next = !v;
    localStorage.setItem('auth-panel-open', String(next));
    return next;
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div id="auth-page-scoped">
      {canEdit && (
        <div className="auth-admin-bar">
          <span className="auth-admin-label">Admin edit mode — click pencil icons to edit text</span>
          <button className="auth-admin-back" onClick={() => navigate('/obs-home')}>← Back to dashboard</button>
        </div>
      )}
      <div className="auth-split">

        {/* LEFT PANEL */}
        <div className={`auth-left${leftOpen ? '' : ' auth-left--collapsed'}`}>
          <div className="auth-left-inner">
            <img src={logo} alt="Baylor University" className="auth-left-logo" />
            <h1 className="auth-left-title">
              <InlineEdit pageKey="login-left-title" defaultValue="Teaching Evaluation" canEdit={canEdit} />
            </h1>
            <p className="auth-left-sub">
              <InlineEdit pageKey="login-left-sub" defaultValue="Baylor University — structured classroom observation platform" canEdit={canEdit} />
            </p>
            <ul className="auth-feature-list">
              <li>
                <CheckCircleFill size={18} className="auth-feature-icon" />
                <InlineEdit pageKey="login-feature-1" defaultValue="44 structured evaluation criteria" canEdit={canEdit} />
              </li>
              <li>
                <CheckCircleFill size={18} className="auth-feature-icon" />
                <InlineEdit pageKey="login-feature-2" defaultValue="AI-powered recommendations" canEdit={canEdit} />
              </li>
              <li>
                <CheckCircleFill size={18} className="auth-feature-icon" />
                <InlineEdit pageKey="login-feature-3" defaultValue="Instant PDF report generation" canEdit={canEdit} />
              </li>
            </ul>
          </div>
          <div className="auth-deco-circle auth-deco-1" />
          <div className="auth-deco-circle auth-deco-2" />
          <div className="auth-deco-circle auth-deco-3" />
        </div>

        {/* TOGGLE — вне панели, всегда виден */}
        <button
          className={`auth-panel-toggle${leftOpen ? '' : ' auth-panel-toggle--closed'}`}
          onClick={togglePanel}
          title={leftOpen ? 'Hide panel' : 'Show panel'}
        >
          {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="auth-form-box">
            <div className="auth-form-header">
              <h2 className="auth-heading">Welcome back</h2>
              <p className="auth-subtext">Sign in to your account to continue</p>
            </div>

            {(loginError || Object.keys(errors).length > 0) && (
              <div className="auth-error">
                {loginError || 'Invalid email or password'}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit(login)}>
              <div className="auth-field">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@baylor.edu"
                  className="auth-input"
                  {...register('email')}
                />
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="auth-input"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? <span className="auth-spinner" /> : 'Sign In'}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">Create account</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
