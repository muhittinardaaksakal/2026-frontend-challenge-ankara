import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <label className="control-group">
      <span className="control-label">Search</span>
      <input
        className="control-input"
        type="search"
        placeholder="Search people, places, notes, messages, or tips"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
