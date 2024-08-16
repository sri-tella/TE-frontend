import React from 'react';
import { Form } from 'react-bootstrap';
import './searchbar.css';

const SearchBar = ({ searchQuery, handleSearchChange }) => {
  return (
    <Form.Control
      type="text"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => handleSearchChange(e.target.value)}
      className="search-bar"
      style={{ maxWidth: '300px', marginLeft: 'auto' }}
    />
  );
};

export default SearchBar;
