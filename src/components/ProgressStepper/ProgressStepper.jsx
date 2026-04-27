import { Fragment } from 'react';
import './ProgressStepper.css';

const STEPS = ['Evaluate', 'Recommendations', 'Report'];

const ProgressStepper = ({ currentStep }) => (
  <div className="progress-stepper">
    {STEPS.map((label, idx) => {
      const stepNum = idx + 1;
      const isCompleted = stepNum < currentStep;
      const isActive = stepNum === currentStep;
      return (
        <Fragment key={label}>
          {idx > 0 && <div className={`stepper-line ${stepNum <= currentStep ? 'done' : ''}`} />}
          <div className="stepper-step">
            <div className={`stepper-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              {isCompleted ? '✓' : stepNum}
            </div>
            <span className={`stepper-label ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              {label}
            </span>
          </div>
        </Fragment>
      );
    })}
  </div>
);

export default ProgressStepper;
