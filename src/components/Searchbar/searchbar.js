import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import './searchbar.css';

const SearchBar = ({ searchQuery, handleSearchChange }) => {
  return (
    <InputGroup className="search-bar-container">
      <InputGroup.Text className="search-icon-box">
        <Search size={18} />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder="Find keywords or sections..."
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="search-bar-input"
      />
    </InputGroup>
  );
};

export default SearchBar;
