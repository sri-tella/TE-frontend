import React from 'react';
import { Form } from 'react-bootstrap';
import './textarea.css';

const TextArea = ({ value, placeholder, onChange }) => {
  return (
    <Form.Control
      as="textarea"
      rows={3}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="custom-textarea shadow-sm"
    />
  );
};

export default TextArea;
