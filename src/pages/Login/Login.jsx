import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/authSchema';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeSlash, CheckCircleFill, ChevronLeft, ChevronRight, EnvelopeFill, LockFill, ArrowRightShort } from 'react-bootstrap-icons';
import InlineEdit from '../../components/InlineEdit/InlineEdit';
import logo from "../../assets/logo.png";
import './Login.css';

const Login = () => {
  const { login, isLoading, error: loginError } = useAuth();
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
      <div className="auth-split">

        {/* LEFT PANEL */}
        <div className={`auth-left${leftOpen ? '' : ' auth-left--collapsed'}`}>
          <div className="auth-left-inner">
            <div className="auth-logo-wrap">
              <img src={logo} alt="Baylor University" className="auth-left-logo" />
            </div>
            <h1 className="auth-left-title">
              <InlineEdit pageKey="login-left-title" defaultValue="Teaching Evaluation" canEdit={false} />
            </h1>
            <p className="auth-left-sub">
              <InlineEdit pageKey="login-left-sub" defaultValue="Baylor University — structured classroom observation platform" canEdit={false} />
            </p>
            <ul className="auth-feature-list">
              <li>
                <CheckCircleFill size={16} className="auth-feature-icon" />
                <InlineEdit pageKey="login-feature-1" defaultValue="44 structured evaluation criteria" canEdit={false} />
              </li>
              <li>
                <CheckCircleFill size={16} className="auth-feature-icon" />
                <InlineEdit pageKey="login-feature-2" defaultValue="AI-powered recommendations" canEdit={false} />
              </li>
              <li>
                <CheckCircleFill size={16} className="auth-feature-icon" />
                <InlineEdit pageKey="login-feature-3" defaultValue="Instant PDF report generation" canEdit={false} />
              </li>
            </ul>
          </div>
          <div className="auth-deco-circle auth-deco-1" />
          <div className="auth-deco-circle auth-deco-2" />
          <div className="auth-deco-circle auth-deco-3" />
          <div className="auth-mesh" />
        </div>

        {/* TOGGLE */}
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
              <div className="auth-badge">Baylor University</div>
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
                <div className="auth-input-group">
                  <span className="auth-input-icon"><EnvelopeFill size={14} /></span>
                  <input
                    type="email"
                    placeholder="you@baylor.edu"
                    className="auth-input"
                    {...register('email')}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="auth-input-group auth-input-wrap">
                  <span className="auth-input-icon"><LockFill size={14} /></span>
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
                {isLoading ? <span className="auth-spinner" /> : <><span>Sign In</span><ArrowRightShort size={22} /></>}
              </button>
            </form>

            <div className="auth-divider"><span>New to the platform?</span></div>

            <p className="auth-switch">
              <Link to="/signup" className="auth-link-btn">Create an account</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
