import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/authSchema';
import { useAuth } from '../../hooks/useAuth';
import logo from "../../assets/logo.png";
import './Login.css';

const Login = () => {
  const { login, isLoading, error: loginError } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data) => {
    login(data);
  };

  return (
    <div id="auth-page-scoped">
      <div className="auth-container">
        <div className="auth-card shadow-lg border-0">
          <div className="auth-logo-wrapper mb-4">
            <img src={logo} alt="Baylor logo" className="auth-logo-img" />
          </div>
          <h2 className="auth-heading">Welcome Back</h2>
          <p className="auth-subtext">Please log in to the Teaching Evaluation system</p>
          
          {(loginError || Object.keys(errors).length > 0) && (
            <div className="error-message">
              {loginError || "Invalid email or password"}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group-v3">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="example@baylor.edu"
                className="form-control-v3"
                {...register('email')}
              />
            </div>
            
            <div className="input-group-v3 mb-4">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-control-v3"
                {...register('password')}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-baylor-gold w-100" 
              disabled={isLoading}
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div className="auth-footer mt-4 text-center">
            <span className="auth-text text-muted">Don't have an account? </span>
            <Link to="/signup" className="auth-link-v3">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
