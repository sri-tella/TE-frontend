import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeFill, MortarboardFill, ArrowRightShort, CheckCircleFill } from 'react-bootstrap-icons';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.svg';
import './ChooseRole.css';

const ROLES = [
  {
    value: 'OBSERVER',
    icon: <EyeFill size={30} />,
    label: 'Observer',
    desc: 'Conduct classroom evaluations, write activity logs, and generate reports for instructors.',
  },
  {
    value: 'INSTRUCTOR',
    icon: <MortarboardFill size={30} />,
    label: 'Instructor',
    desc: 'Complete the pre-observation questionnaire and view your evaluation reports and feedback.',
  },
];

const ChooseRole = () => {
  const navigate = useNavigate();
  const { user, setActiveRole } = useAuthStore();
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const availableRoles = ROLES.filter(r => userRoles.includes(r.value));
  const [selected, setSelected] = useState(() =>
    availableRoles.length === 1 ? availableRoles[0].value : ''
  );
  const [saving, setSaving] = useState(false);

  const handleConfirm = async (roleOverride) => {
    const role = roleOverride || selected;
    if (!role) return toast.warning('Please select a role to continue.');
    setSaving(true);
    try {
      const response = await authApi.setActiveRole(user?.userId, role);
      setActiveRole(role, {
        observerId: response?.observerId ?? user?.observerId,
        instructorId: response?.instructorId ?? user?.instructorId,
      });
      navigate(role === 'INSTRUCTOR' ? '/ins-home' : '/obs-home', { replace: true });
    } catch {
      toast.error('Could not save role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    if (availableRoles.length === 1) {
      handleConfirm(availableRoles[0].value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="choose-role-page">
      <div className="cr-bg-deco cr-deco-1" />
      <div className="cr-bg-deco cr-deco-2" />
      <div className="cr-mesh" />

      <div className="cr-wrap">
        <div className="cr-logo-wrap">
          <img src={logo} alt="Peer Lens" className="cr-logo" />
        </div>

        <h1 className="cr-heading">How will you use Peer Lens?</h1>
        <p className="cr-sub">
          Choose your role to get started.{' '}
          <span className="cr-sub-note">You can switch at any time from your <strong>Profile</strong> page.</span>
        </p>

        <div className="cr-cards">
          {availableRoles.map(r => (
            <button
              key={r.value}
              type="button"
              className={`cr-card${selected === r.value ? ' cr-card--selected' : ''}`}
              onClick={() => setSelected(r.value)}
            >
              <div className="cr-card-icon">{r.icon}</div>
              <div className="cr-card-label">{r.label}</div>
              <div className="cr-card-desc">{r.desc}</div>
              {selected === r.value && (
                <CheckCircleFill size={16} className="cr-card-check" />
              )}
            </button>
          ))}
        </div>

        <button
          className="cr-confirm-btn"
          onClick={handleConfirm}
          disabled={saving || !selected}
        >
          {saving
            ? <span className="cr-spinner" />
            : <><span>Continue</span><ArrowRightShort size={22} /></>
          }
        </button>
      </div>
    </div>
  );
};

export default ChooseRole;
