import React from 'react';
import { Form } from 'react-bootstrap';
import './textarea.css';

const TextArea = ({ value, disabled, className }) => {
  return (
    <div>
      <p class='heading'>Please type in any additional feedback or comments.</p>
      <Form.Control
              as="textarea"
              rows="4"
              value={value}
              disabled={disabled}
              className={`full-width-textarea ${className}`}
            />
    </div>
  );
};

export default TextArea;
