import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <label className="control-group">
      <span className="control-label">Search</span>
      <input
        className="control-input"
        type="search"
        placeholder="Search by id, title, or description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
