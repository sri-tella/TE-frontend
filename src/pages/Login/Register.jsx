import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import logo from '../../assets/logo.png';
import { toast } from 'react-toastify';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: (userData) => authApi.signup(userData),
    onSuccess: () => {
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Signup failed. Please try again.');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = (e) => {
    e.preventDefault();

    if (formData.email !== formData.confirmEmail) {
      toast.error('Emails do not match');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }

    signupMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      roles: [formData.role]
    });
  };

  return (
    <div id="auth-page-scoped">
      <div className="auth-container">
        <div className="auth-card signup-card shadow-lg border-0">
          <div className="auth-logo-wrapper mb-4 text-center">
            <img src={logo} alt="Baylor logo" className="auth-logo-img" />
          </div>
          <h2 className="auth-heading text-center">Create Account</h2>
          <p className="auth-subtext text-center">Join the Teaching Evaluation system</p>
          
          <form className="auth-form" onSubmit={handleSignup}>
            
            <div className="form-row-v3 d-flex gap-3 mb-3">
              <div className="input-group-v3 flex-grow-1">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  className="form-control-v3"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group-v3 flex-grow-1">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  className="form-control-v3"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group-v3 mb-3">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="example@baylor.edu"
                className="form-control-v3"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group-v3 mb-3">
              <label>Confirm Email</label>
              <input
                type="email"
                name="confirmEmail"
                placeholder="Confirm your email"
                className="form-control-v3"
                value={formData.confirmEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row-v3 d-flex gap-3 mb-3">
              <div className="input-group-v3 flex-grow-1">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="form-control-v3"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group-v3 flex-grow-1">
                <label>Confirm</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm"
                  className="form-control-v3"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group-v3 mb-4">
              <label>Choose Your Role</label>
              <select 
                name="role"
                className="form-control-v3 select-v3"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select a role...</option>
                <option value="OBSERVER">Observer</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-baylor-gold w-100" 
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                 <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  CREATING ACCOUNT...
                 </>
              ) : (
                'SIGN UP'
              )}
            </button>
          </form>
          
          <div className="auth-footer text-center mt-4">
            <span className="auth-text text-muted">Already have an account? </span>
            <Link to="/login" className="auth-link-v3">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
