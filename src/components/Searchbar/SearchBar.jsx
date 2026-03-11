import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import './searchbar.css';

const SearchBar = ({ searchQuery, handleSearchChange }) => {
  return (
    <InputGroup className="search-bar-v3 shadow-sm">
      <InputGroup.Text className="bg-white border-end-0">
        <Search className="text-muted" />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder="Search criteria, sections or feedback..."
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="border-start-0"
      />
    </InputGroup>
  );
};

export default SearchBar;
